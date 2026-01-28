import { GameInfoButton } from '@/components/game-info-button';
import { GameInfoModal, GUESS_INFO } from '@/components/game-info-modal';
import { NoActiveGame } from '@/components/no-active-game';
import { PlayHeader } from '@/components/play-header';
import { PlayerAvatar } from '@/components/player-avatar';

import { Button } from '@/components/ui/button';
import { useCooldownTimer } from '@/hooks/use-cooldown-timer';
import { getInitials } from '@/hooks/use-initials';
import {
    NotificationItem,
    useNotifications,
} from '@/hooks/use-notifications';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    Lightbulb,
    RefreshCw,
    Search,
    Skull,
    Snowflake,
    Sparkles,
    Timer,
    Trophy,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QuestionItem {
    id: number;
    question: string;
    answer: 'yes' | 'no' | 'winner' | 'unclear' | 'unknown' | 'failed';
    wit?: string;
    player: {
        id: number;
        name: string;
        avatar_url: string | null;
    };
    created_at: string;
}

interface Props {
    player?: {
        id: number;
        name: string;
        points: number;
        cooldown_remaining?: number;
        cooldown_ends_at?: string;
    };
    game?: {
        id: number;
        status: string;
        winner_id: number | null;
        secret_word_length?: number;
    };
    questions?: QuestionItem[];
    error?: string;
    testMode?: { active: boolean; secretWord?: string };
    isAdmin?: boolean;
    revealedSabotagedIds?: number[];
    notifications?: NotificationItem[];
}

const QUESTION_COST = 10;
const POLL_INTERVAL = 10_000; // 10 seconds

const SNOWFLAKES = Array.from({ length: 6 }).map((_, i) => ({
    left: (i * 16 + ((i * 11) % 10)) % 100,
    delay: (i * 500) % 2000,
    duration: 12 + (i % 3) * 4,
    size: 12 + (i % 3) * 6,
    opacity: 0.06 + (i % 3) * 0.03,
}));

const PLAYER_COLORS = [
    'oklch(55% 0.15 230)',
    'oklch(55% 0.15 145)',
    'oklch(60% 0.15 30)',
    'oklch(55% 0.15 280)',
    'oklch(55% 0.12 200)',
    'oklch(60% 0.15 60)',
];

export default function GuessPage({
    player,
    game,
    questions: initialQuestions = [],
    error,
    testMode,
    revealedSabotagedIds = [],
    notifications: initialNotifications = [],
}: Props) {
    const [questions, setQuestions] =
        useState<QuestionItem[]>(initialQuestions);
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [points, setPoints] = useState(player?.points ?? 0);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const victoryTimerRef = useRef<number | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [showInfoModal, setShowInfoModal] = useState(false);

    // Sabotage reveal state - from server props (no more sessionStorage!)
    const [sabotagedQuestionIds, setSabotagedQuestionIds] =
        useState<number[]>(revealedSabotagedIds);

    // Track which questions are being retried
    const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());

    // Notifications toast display
    useNotifications({
        notifications: initialNotifications,
        enabled: !testMode?.active,
    });

    // Cooldown timer
    const { isOnCooldown, formatted: cooldownFormatted } = useCooldownTimer(
        player?.cooldown_remaining ?? 0,
    );

    // Sync revealed sabotage IDs from server (on poll updates)
    useEffect(() => {
        setSabotagedQuestionIds(revealedSabotagedIds);
    }, [revealedSabotagedIds]);

    const canAsk =
        points >= QUESTION_COST && input.trim().length >= 3 && !isOnCooldown;

    // Cleanup victory timer on unmount
    useEffect(
        () => () => {
            if (victoryTimerRef.current)
                window.clearTimeout(victoryTimerRef.current);
        },
        [],
    );

    useEffect(() => {
        if (listRef.current) {
            // Use requestAnimationFrame to ensure DOM has updated before scrolling
            requestAnimationFrame(() => {
                if (listRef.current) {
                    listRef.current.scrollTo({
                        top: listRef.current.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            });
        }
    }, [questions, pendingQuestion]);

    // Poll for game updates (winner detection for admins, question feed for all)
    useEffect(() => {
        if (testMode?.active || error) return;
        if (game?.status === 'completed') {
            // If current player is the winner, go to /win, otherwise /lose
            if (game?.winner_id === player?.id) {
                router.visit('/win');
            } else {
                router.visit('/lose');
            }
            return;
        }

        // Pause polling when tab is hidden or offline
        const shouldPoll = () =>
            document.visibilityState === 'visible' && navigator.onLine;

        const poll = () => {
            if (shouldPoll()) {
                router.reload({
                    only: [
                        'game',
                        'questions',
                        'player',
                        'revealedSabotagedIds',
                        'notifications',
                    ],
                });
            }
        };

        pollRef.current = setInterval(poll, POLL_INTERVAL);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [testMode?.active, error, game?.status]);

    // Sync questions from props (for polling updates)
    useEffect(() => {
        setQuestions(initialQuestions);
    }, [initialQuestions]);

    // Sync points from props (for polling updates)
    useEffect(() => {
        if (player?.points !== undefined) setPoints(player.points);
    }, [player?.points]);

    const handleSubmit = useCallback(async () => {
        if (!canAsk || isSubmitting) return;

        const questionText = input.trim();
        setIsSubmitting(true);
        setMessage(null);
        setPendingQuestion(questionText);
        setInput('');

        // Early offline detection for better UX
        if (!navigator.onLine) {
            setMessage({ type: 'error', text: 'Je bent offline' });
            setInput(questionText);
            setIsSubmitting(false);
            setPendingQuestion(null);
            return;
        }

        try {
            const response = await fetch('/play/guess/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ question: questionText }),
            });

            // Safely parse JSON - handle non-JSON responses (offline/proxy errors)
            let data: Record<string, unknown> | null = null;
            try {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    data = await response.json();
                }
            } catch {
                data = null;
            }

            if (!response.ok) {
                const errorMessages: Record<string, string> = {
                    insufficient_points: 'Niet genoeg punten',
                    game_not_active: 'Spel is niet actief',
                    ai_error: (data?.message as string) || 'Er ging iets mis',
                    multi_guess:
                        (data?.message as string) || 'Raad één woord tegelijk',
                    cooldown_active: 'Wacht tot de cooldown voorbij is',
                };
                setMessage({
                    type: 'error',
                    text:
                        errorMessages[(data?.error as string) || ''] ||
                        'Er ging iets mis',
                });
                setInput(questionText);
                return;
            }

            if (!data) {
                setMessage({
                    type: 'error',
                    text: 'Ongeldig antwoord ontvangen',
                });
                setInput(questionText);
                return;
            }

            // Check if this is a winning response - redirect to win page
            if (data.winner === true) {
                setQuestions((prev) => [
                    ...prev,
                    data.question as QuestionItem,
                ]);

                // Haptic feedback for the win
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100, 50, 200]);
                }

                // Give time to read the winning response, then redirect
                victoryTimerRef.current = window.setTimeout(() => {
                    router.visit('/win');
                }, 2500);

                return;
            }

            // Wrong guess feedback
            if (data.wrong_guess) {
                setQuestions((prev) => [
                    ...prev,
                    data.question as QuestionItem,
                ]);
                setPoints(data.points_remaining as number);
                setMessage({
                    type: 'error',
                    text: `"${data.guessed_word}" is niet het woord`,
                });
                setTimeout(() => setMessage(null), 3000);
                inputRef.current?.focus();
                return;
            }

            // Regular question response
            setQuestions((prev) => [...prev, data.question as QuestionItem]);
            setPoints(data.points_remaining as number);
            inputRef.current?.focus();
        } catch {
            setMessage({ type: 'error', text: 'Verbinding mislukt' });
            setInput(questionText);
        } finally {
            setIsSubmitting(false);
            setPendingQuestion(null);
        }
    }, [canAsk, isSubmitting, input]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && canAsk) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleRetry = useCallback(async (questionId: number) => {
        if (retryingIds.has(questionId)) return;

        setRetryingIds((prev) => new Set(prev).add(questionId));

        try {
            const res = await fetch(`/play/guess/retry/${questionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            const data = await res.json();

            if (data.success && data.question) {
                setQuestions((prev) =>
                    prev.map((q) =>
                        q.id === questionId ? (data.question as QuestionItem) : q,
                    ),
                );
                setPoints(data.points_remaining as number);
            } else {
                setMessage({
                    type: 'error',
                    text: data.message || 'Retry mislukt',
                });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch {
            setMessage({ type: 'error', text: 'Verbinding mislukt' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setRetryingIds((prev) => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
            });
        }
    }, [retryingIds]);

    if (error === 'no_active_game') {
        return <NoActiveGame title="Vraag" />;
    }

    const questionsRemaining = Math.floor(points / QUESTION_COST);

    const inputAreaHeight = points < QUESTION_COST ? '9rem' : '7rem';

    return (
        <PlayLayout>
            <Head title="Vraag" />
            <div className="relative flex h-full flex-col overflow-hidden pt-[calc(var(--header-height)+var(--safe-top)+0.5rem)]">
                {/* Background snowflakes */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {SNOWFLAKES.map((flake, i) => (
                        <div
                            key={i}
                            className="animate-snow-fall absolute"
                            style={{
                                left: `${flake.left}%`,
                                animationDelay: `${flake.delay}ms`,
                                animationDuration: `${flake.duration}s`,
                                opacity: flake.opacity,
                            }}
                        >
                            <Snowflake
                                className="text-primary/40"
                                style={{
                                    width: flake.size,
                                    height: flake.size,
                                }}
                            />
                        </div>
                    ))}
                </div>

                <PlayHeader
                    title="Rarara"
                    points={points}
                    testId="guess-points-display"
                    testMode={testMode?.active}
                    rightAction={
                        <GameInfoButton
                            onClick={() => setShowInfoModal(true)}
                        />
                    }
                />

                {/* Game info modal */}
                <GameInfoModal
                    open={showInfoModal}
                    onOpenChange={setShowInfoModal}
                    content={GUESS_INFO}
                />

                {/* Message */}
                {message && (
                    <div
                        className={cn(
                            'mx-4 mt-3 rounded-lg px-4 py-2.5 text-center text-sm font-semibold',
                            'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2',
                            message.type === 'error'
                                ? 'bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive'
                                : 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary',
                        )}
                    >
                        {message.text}
                    </div>
                )}

                {/* Question History - scrollable area with padding for fixed input */}
                <div
                    ref={listRef}
                    className="relative flex-1 overflow-y-auto"
                    style={{ paddingBottom: inputAreaHeight }}
                >
                    {questions.length === 0 && !pendingQuestion ? (
                        <EmptyState
                            questionsRemaining={questionsRemaining}
                            onSelectHint={(text) => {
                                setInput(text);
                                inputRef.current?.focus();
                            }}
                        />
                    ) : (
                        <div data-testid="guess-history" className="px-4 py-4">
                            <div className="space-y-3">
                                {questions.map((q, idx) => (
                                    <QuestionBubble
                                        key={q.id}
                                        question={q}
                                        isOwn={q.player.id === player?.id}
                                        isNew={
                                            idx === questions.length - 1 &&
                                            !pendingQuestion
                                        }
                                        playerColorIdx={
                                            q.player.id % PLAYER_COLORS.length
                                        }
                                        isSabotaged={sabotagedQuestionIds.includes(
                                            q.id,
                                        )}
                                        onRetry={
                                            q.answer === 'failed' &&
                                            q.player.id === player?.id
                                                ? () => handleRetry(q.id)
                                                : undefined
                                        }
                                        isRetrying={retryingIds.has(q.id)}
                                    />
                                ))}
                                {pendingQuestion && player && (
                                    <PendingBubble
                                        question={pendingQuestion}
                                        playerName={player.name}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Input Area - positioned above bottom nav */}
                <div
                    className="fixed inset-x-0 z-20 border-t border-border/80 bg-gradient-to-b from-card to-background px-4 pt-4 pb-4"
                    style={{ bottom: 'calc(64px + var(--safe-bottom))' }}
                >
                    {/* Question cost indicator */}
                    <div className="mb-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            {isOnCooldown ? (
                                <>
                                    <Timer className="size-3.5 shrink-0 animate-pulse" />
                                    <span>
                                        Cooldown:{' '}
                                        <span className="font-medium tabular-nums text-foreground">
                                            {cooldownFormatted}
                                        </span>
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-3.5" />
                                    {questionsRemaining}{' '}
                                    {questionsRemaining === 1
                                        ? 'vraag'
                                        : 'vragen'}{' '}
                                    over
                                </>
                            )}
                        </span>
                        <span className="font-medium text-primary">
                            {QUESTION_COST} punten per vraag
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                data-testid="guess-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Stel een vraag of raad: 'Is het woord...'"
                                disabled={
                                    isSubmitting ||
                                    points < QUESTION_COST ||
                                    isOnCooldown
                                }
                                className={cn(
                                    'h-12 w-full rounded-xl border-2 border-border/60 bg-card pr-12 pl-4 text-base',
                                    'transition-all duration-200 outline-none',
                                    'placeholder:text-muted-foreground/70',
                                    'focus:border-primary/50 focus:ring-4 focus:ring-primary/10',
                                    'disabled:cursor-not-allowed disabled:opacity-50',
                                )}
                            />
                            <Search className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground/50" />
                        </div>
                        <Button
                            data-testid="guess-submit-button"
                            onClick={handleSubmit}
                            disabled={!canAsk || isSubmitting}
                            size="lg"
                            className={cn(
                                'h-12 min-w-[100px] rounded-xl font-semibold',
                                canAsk && 'shadow-lg shadow-primary/25',
                            )}
                        >
                            {isSubmitting ? <ThinkingDots /> : 'Vraag'}
                        </Button>
                    </div>

                    {points < QUESTION_COST && !isOnCooldown && (
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Je hebt {QUESTION_COST} punten nodig om een vraag te
                            stellen
                        </p>
                    )}
                </div>
            </div>
        </PlayLayout>
    );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function EmptyState({
    questionsRemaining,
    onSelectHint,
}: {
    questionsRemaining: number;
    onSelectHint?: (text: string) => void;
}) {
    return (
        <div className="flex h-full flex-col items-center justify-center px-6 py-8">
            {/* Magnifying glass with frost */}
            <div className="relative mb-6">
                <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/10">
                    <Search className="size-12 text-primary/40" />
                </div>
                <Snowflake className="absolute -top-2 -right-2 size-8 text-primary/30" />
                <Snowflake className="absolute -bottom-1 -left-3 size-6 text-primary/20" />
            </div>

            <h2 className="font-display text-xl font-bold text-foreground">
                Het mysterie wacht...
            </h2>
            <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
                Stel ja/nee vragen om het woord te ontdekken, of waag een gok!
            </p>

            {/* Example hints - clickable to auto-fill input */}
            <div className="mt-6 space-y-2">
                <ExampleHint
                    emoji="🐾"
                    text="Is het een dier?"
                    onClick={() => onSelectHint?.('Is het een dier?')}
                />
                <ExampleHint
                    emoji="🎯"
                    text="Is het woord 'winter'?"
                    onClick={() => onSelectHint?.("Is het woord 'winter'?")}
                />
                <ExampleHint
                    emoji="❄️"
                    text="Is het koud?"
                    onClick={() => onSelectHint?.('Is het koud?')}
                />
            </div>

            {questionsRemaining > 0 && (
                <div className="mt-8 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                        Je kunt {questionsRemaining}{' '}
                        {questionsRemaining === 1 ? 'vraag' : 'vragen'} stellen
                    </span>
                </div>
            )}
        </div>
    );
}

function ExampleHint({
    emoji,
    text,
    onClick,
}: {
    emoji: string;
    text: string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-left',
                'transition-all duration-150',
                'hover:bg-primary/10 hover:ring-1 hover:ring-primary/20',
                'active:scale-[0.98] active:bg-primary/15',
            )}
        >
            <span className="text-lg">{emoji}</span>
            <span className="text-sm text-muted-foreground italic">
                "{text}"
            </span>
        </button>
    );
}

function ThinkingDots() {
    return (
        <span className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="size-1.5 animate-pulse rounded-full bg-current"
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
        </span>
    );
}

function PendingBubble({
    question,
    playerName,
}: {
    question: string;
    playerName: string;
}) {
    const initials = getInitials(playerName);

    return (
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            {/* Own question bubble (right-aligned) */}
            <div className="flex justify-end">
                <div className="max-w-[85%]">
                    <div className="flex items-end justify-end gap-2">
                        <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                            {question}
                        </div>
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {initials}
                        </div>
                    </div>
                </div>
            </div>

            {/* Thinking indicator */}
            <div className="mt-3 flex items-center gap-2 pl-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/60">
                    <Snowflake
                        className="size-4 animate-spin text-primary/60"
                        style={{ animationDuration: '3s' }}
                    />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted/80 px-4 py-2.5 text-sm text-muted-foreground">
                    <ThinkingDots />
                </div>
            </div>
        </div>
    );
}

function QuestionBubble({
    question,
    isOwn,
    isNew,
    playerColorIdx,
    isSabotaged = false,
    onRetry,
    isRetrying = false,
}: {
    question: QuestionItem;
    isOwn: boolean;
    isNew: boolean;
    playerColorIdx: number;
    isSabotaged?: boolean;
    onRetry?: () => void;
    isRetrying?: boolean;
}) {
    const initials = getInitials(question.player.name);
    const isYes = question.answer === 'yes';
    const isUnclear = question.answer === 'unclear' || question.answer === 'unknown';
    const isWinner = question.answer === 'winner';
    const isFailed = question.answer === 'failed';
    const playerColor = PLAYER_COLORS[playerColorIdx];

    return (
        <div
            data-testid={`guess-item-${question.id}`}
            className={cn(
                isNew &&
                    'motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
            )}
        >
            {isOwn ? (
                /* Own question - right aligned */
                <div className="flex justify-end">
                    <div className="max-w-[85%]">
                        <div className="flex items-end justify-end gap-2">
                            <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                                {question.question}
                            </div>
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                {initials}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Other player's question - left aligned */
                <div className="flex justify-start">
                    <div className="max-w-[85%]">
                        <div className="flex items-end gap-2">
                            <PlayerAvatar
                                name={question.player.name}
                                avatarUrl={question.player.avatar_url}
                                className="size-7 ring-2 ring-background"
                                fallbackClassName="text-[10px] text-white"
                                fallbackStyle={{ backgroundColor: playerColor }}
                            />
                            <div>
                                <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                                    {question.player.name}
                                </span>
                                <div className="rounded-2xl rounded-bl-sm bg-muted/80 px-4 py-2.5 text-sm text-foreground">
                                    {question.question}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Answer bubble from "Game Master" */}
            <div className="mt-2 flex items-center gap-2 pl-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/60">
                    {isWinner ? (
                        <Trophy className="size-4 text-amber-500" />
                    ) : isFailed ? (
                        <AlertTriangle className="size-4 text-amber-500" />
                    ) : (
                        <Snowflake className="size-4 text-primary/60" />
                    )}
                </div>
                <div
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm font-semibold shadow-sm',
                        'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in',
                        isSabotaged && 'ring-2 ring-destructive/50',
                        isWinner
                            ? 'bg-gradient-to-r from-amber-400/25 to-amber-500/15 text-amber-600 dark:text-amber-400'
                            : isFailed
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400'
                              : isYes
                                ? 'bg-gradient-to-r from-success/20 to-success/10 text-success'
                                : isUnclear
                                  ? 'bg-gradient-to-r from-muted/60 to-muted/40 text-muted-foreground'
                                  : 'bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive',
                    )}
                >
                    {isSabotaged && (
                        <span className="mr-0.5 flex items-center gap-1 rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold text-destructive uppercase">
                            <Skull className="size-3" />
                            Gesaboteerd
                        </span>
                    )}
                    {isWinner ? (
                        <Trophy className="size-4 shrink-0" />
                    ) : isFailed ? (
                        <AlertTriangle className="size-4 shrink-0" />
                    ) : isYes ? (
                        <Check className="size-4 shrink-0" />
                    ) : isUnclear ? (
                        <Snowflake className="size-4 shrink-0" />
                    ) : (
                        <X className="size-4 shrink-0" />
                    )}
                    <span>
                        {isWinner
                            ? 'Correct! 🎉'
                            : isFailed
                              ? 'AI fout'
                              : question.wit || (isYes ? 'Ja' : isUnclear ? 'Onduidelijk' : 'Nee')}
                    </span>
                </div>
                {/* Retry button for failed questions */}
                {isFailed && onRetry && (
                    <button
                        onClick={onRetry}
                        disabled={isRetrying}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                            'border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            'transition-all duration-150 ease-out',
                            'hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                        )}
                    >
                        <RefreshCw className={cn('size-3', isRetrying && 'animate-spin')} />
                        {isRetrying ? 'Bezig...' : 'Opnieuw'}
                    </button>
                )}
            </div>
        </div>
    );
}
