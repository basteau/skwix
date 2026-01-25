import { getPortraitUrl } from '@/components/avatar-picker';
import { GameInfoButton } from '@/components/game-info-button';
import { GameInfoModal, GUESS_INFO } from '@/components/game-info-modal';
import { NoActiveGame } from '@/components/no-active-game';
import { PlayHeader } from '@/components/play-header';

import { Button } from '@/components/ui/button';
import { getInitials } from '@/hooks/use-initials';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
    Check,
    Crown,
    Search,
    Snowflake,
    Sparkles,
    Star,
    Trophy,
    X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

interface QuestionItem {
    id: number;
    question: string;
    answer: 'yes' | 'no' | 'winner' | 'unclear';
    player: {
        id: number;
        name: string;
        avatar_url: string | null;
    };
    created_at: string;
}

interface WinnerData {
    id: number;
    name: string;
    avatar_url: string | null;
    points: number;
}

interface Props {
    player?: {
        id: number;
        name: string;
        points: number;
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

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

const CONFETTI_DATA = Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    x: seededRandom(i * 10 + 1) * 100,
    delay: seededRandom(i * 10 + 3) * 1.5,
    duration: 2 + seededRandom(i * 10 + 4) * 1.5,
    size: 6 + seededRandom(i * 10 + 5) * 8,
    rotation: seededRandom(i * 10 + 6) * 360,
    colorIdx: Math.floor(seededRandom(i * 10 + 2) * 5),
}));

export default function GuessPage({
    player,
    game,
    questions: initialQuestions = [],
    error,
    testMode,
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

    // Victory state
    const [showVictory, setShowVictory] = useState(false);
    const [victoryData, setVictoryData] = useState<{
        winner: WinnerData;
        secretWord: string;
        prizeUrl: string;
    } | null>(null);
    const [victoryPhase, setVictoryPhase] = useState<
        'reveal' | 'celebrate' | 'prize'
    >('reveal');
    const [showInfoModal, setShowInfoModal] = useState(false);

    const canAsk = points >= QUESTION_COST && input.trim().length >= 3;

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
            listRef.current.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [questions, pendingQuestion]);

    // Victory phase progression - reset phase when victory starts
    useEffect(() => {
        if (!showVictory) return;

        setVictoryPhase('reveal');
        const timers: ReturnType<typeof setTimeout>[] = [];

        // Phase 1: Reveal (2s) → Celebrate
        timers.push(setTimeout(() => setVictoryPhase('celebrate'), 2000));
        // Phase 2: Celebrate (3s) → Prize
        timers.push(setTimeout(() => setVictoryPhase('prize'), 5000));

        return () => timers.forEach(clearTimeout);
    }, [showVictory]);

    // Poll for game updates (winner detection for admins, question feed for all)
    useEffect(() => {
        if (testMode?.active || error || showVictory) return;
        if (game?.status === 'completed') {
            router.visit('/game/end');
            return;
        }

        pollRef.current = setInterval(() => {
            router.reload({ only: ['game', 'questions', 'player'] });
        }, POLL_INTERVAL);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [testMode?.active, error, game?.status, showVictory]);

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

            // Check if this is a winning response
            if (data.winner === true) {
                setQuestions((prev) => [
                    ...prev,
                    data.question as QuestionItem,
                ]);
                setPoints(data.points_remaining as number);

                // Trigger victory celebration with cleanup-safe timer
                victoryTimerRef.current = window.setTimeout(() => {
                    setVictoryData({
                        winner: data.winner_data as WinnerData,
                        secretWord: (data.game as { secret_word: string })
                            .secret_word,
                        prizeUrl: data.prize_url as string,
                    });
                    setShowVictory(true);

                    // Haptic feedback for the win
                    if ('vibrate' in navigator) {
                        navigator.vibrate([100, 50, 100, 50, 200]);
                    }
                }, 800);

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

    if (error === 'no_active_game') {
        return <NoActiveGame title="Vraag" />;
    }

    // Victory screen - takes over the entire view
    if (showVictory && victoryData) {
        return (
            <VictoryCelebration
                winner={victoryData.winner}
                secretWord={victoryData.secretWord}
                prizeUrl={victoryData.prizeUrl}
                phase={victoryPhase}
                isOwnVictory={victoryData.winner.id === player?.id}
            />
        );
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
                    title="Mystery Woord"
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
                            <Sparkles className="size-3.5" />
                            {questionsRemaining}{' '}
                            {questionsRemaining === 1 ? 'vraag' : 'vragen'} over
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
                                    isSubmitting || points < QUESTION_COST
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

                    {points < QUESTION_COST && (
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
// VICTORY CELEBRATION COMPONENT
// =============================================================================

function VictoryCelebration({
    winner,
    secretWord,
    prizeUrl,
    phase,
    isOwnVictory,
}: {
    winner: WinnerData;
    secretWord: string;
    prizeUrl: string;
    phase: 'reveal' | 'celebrate' | 'prize';
    isOwnVictory: boolean;
}) {
    const [revealedLetters, setRevealedLetters] = useState(0);
    const initials = getInitials(winner.name);
    const portraitUrl = getPortraitUrl(winner.avatar_url);
    const continueButtonRef = useRef<HTMLButtonElement>(null);

    // Letter reveal animation
    useEffect(() => {
        if (phase !== 'reveal' && phase !== 'celebrate') return;

        if (revealedLetters < secretWord.length) {
            const timer = setTimeout(() => {
                setRevealedLetters((prev) => prev + 1);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [revealedLetters, secretWord.length, phase]);

    // Focus management for accessibility - focus continue button when celebration starts
    useEffect(() => {
        if (phase === 'celebrate' || phase === 'prize') {
            continueButtonRef.current?.focus();
        }
    }, [phase]);

    // Prevent background scroll while victory is shown
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleContinue = () => {
        router.visit(isOwnVictory ? '/win' : '/lose');
    };

    return (
        <>
            <Head title={isOwnVictory ? 'Gewonnen!' : 'Spel Afgelopen'} />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="victory-title"
                className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden overscroll-contain bg-gradient-to-b from-background via-primary/5 to-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
            >
                {/* Screen reader announcement */}
                <div className="sr-only" aria-live="assertive">
                    {isOwnVictory
                        ? 'Je hebt gewonnen!'
                        : `${winner.name} heeft gewonnen!`}
                </div>

                {/* Confetti - only in celebrate phase, hidden for reduced motion */}
                {phase !== 'reveal' && <Confetti />}

                {/* Golden glow backdrop */}
                <div
                    className={cn(
                        'absolute inset-0 transition-opacity duration-1000',
                        phase === 'reveal' ? 'opacity-0' : 'opacity-100',
                    )}
                    style={{
                        background:
                            'radial-gradient(ellipse at center, oklch(80% 0.15 80 / 0.15) 0%, transparent 60%)',
                    }}
                />

                {/* Main content */}
                <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">
                    {/* Phase 1: Word Reveal */}
                    <div
                        className={cn(
                            'transition-all duration-700',
                            phase === 'reveal'
                                ? 'scale-100 opacity-100'
                                : 'absolute scale-95 opacity-0',
                        )}
                    >
                        <p className="mb-4 text-sm font-medium tracking-widest text-muted-foreground uppercase">
                            Het woord is...
                        </p>
                        <div className="flex justify-center gap-2">
                            {secretWord.split('').map((letter, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex size-14 items-center justify-center rounded-xl border-2 font-display text-2xl font-bold uppercase shadow-lg transition-all duration-300',
                                        i < revealedLetters
                                            ? 'scale-100 border-amber-400/50 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 dark:from-amber-900/30 dark:to-amber-800/30 dark:text-amber-300'
                                            : 'scale-75 border-border bg-muted text-transparent',
                                    )}
                                    style={{
                                        transitionDelay: `${i * 50}ms`,
                                    }}
                                >
                                    {letter}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phase 2 & 3: Celebration */}
                    {phase !== 'reveal' && (
                        <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:zoom-in-95 motion-safe:fade-in">
                            {/* Trophy / Crown */}
                            <div className="relative mb-4 flex justify-center">
                                <div className="relative">
                                    <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-xl shadow-amber-500/30">
                                        {isOwnVictory ? (
                                            <Trophy className="size-10 text-white" />
                                        ) : (
                                            <Crown className="size-10 text-white" />
                                        )}
                                    </div>
                                    <Star className="absolute -top-1 -right-1 size-6 fill-amber-300 text-amber-300 motion-safe:animate-pulse" />
                                    <Star
                                        className="absolute -bottom-1 -left-2 size-4 fill-amber-200 text-amber-200 motion-safe:animate-pulse"
                                        style={{ animationDelay: '0.5s' }}
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h1
                                id="victory-title"
                                className="font-display text-4xl font-bold tracking-tight text-foreground"
                            >
                                {isOwnVictory ? 'Gewonnen!' : 'Spel Afgelopen'}
                            </h1>

                            {/* Winner Portrait/Avatar & Name */}
                            <div className="mt-6 flex flex-col items-center">
                                <div className="relative">
                                    {portraitUrl ? (
                                        <img
                                            src={portraitUrl}
                                            alt={winner.name}
                                            data-testid="winner-portrait"
                                            className="size-32 rounded-2xl border-4 border-amber-400/60 object-cover shadow-lg"
                                        />
                                    ) : winner.avatar_url ? (
                                        <img
                                            src={winner.avatar_url}
                                            alt={winner.name}
                                            className="size-20 rounded-full border-4 border-amber-400/60 object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="flex size-20 items-center justify-center rounded-full border-4 border-amber-400/60 bg-gradient-to-br from-primary/20 to-primary/10 font-display text-2xl font-bold text-primary shadow-lg">
                                            {initials}
                                        </div>
                                    )}
                                    {isOwnVictory && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Crown className="size-7 fill-amber-400 text-amber-500" />
                                        </div>
                                    )}
                                </div>
                                <p className="mt-3 font-display text-xl font-bold text-foreground">
                                    {winner.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isOwnVictory
                                        ? 'heeft het mysterie opgelost!'
                                        : 'heeft gewonnen'}
                                </p>

                                {/* Points badge */}
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400/20 via-amber-500/20 to-amber-400/20 px-4 py-1.5">
                                    <Sparkles className="size-4 text-amber-500" />
                                    <span className="font-display text-base font-bold text-foreground">
                                        {winner.points} punten
                                    </span>
                                </div>
                            </div>

                            {/* Secret word (small) */}
                            <div className="mt-6">
                                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                                    Het woord was
                                </p>
                                <p className="mt-1 font-display text-lg font-bold tracking-wider text-primary uppercase">
                                    {secretWord}
                                </p>
                            </div>

                            {/* QR Code for winner */}
                            {isOwnVictory && phase === 'prize' && (
                                <div
                                    role="group"
                                    aria-label="Prijs QR-code"
                                    className="mt-6 motion-safe:animate-in motion-safe:duration-500 motion-safe:zoom-in-95 motion-safe:fade-in"
                                >
                                    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white p-1 shadow-lg">
                                        <div className="flex items-center justify-center gap-2 rounded-t-xl bg-gradient-to-r from-primary via-primary to-primary/90 py-2">
                                            <Star className="size-4 text-primary-foreground" />
                                            <span className="text-sm font-bold tracking-wide text-primary-foreground uppercase">
                                                Jouw Prijs
                                            </span>
                                            <Star className="size-4 text-primary-foreground" />
                                        </div>
                                        <div className="bg-white p-3">
                                            <QRCode
                                                value={prizeUrl}
                                                size={120}
                                            />
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Scan om je prijs te claimen
                                    </p>
                                </div>
                            )}

                            {/* Continue button */}
                            <Button
                                ref={continueButtonRef}
                                onClick={handleContinue}
                                size="lg"
                                className="mt-8 w-full max-w-xs shadow-lg"
                            >
                                {isOwnVictory
                                    ? 'Bekijk je prijs'
                                    : 'Bekijk resultaten'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const Confetti = memo(function Confetti() {
    const colors = [
        'oklch(80% 0.15 85)', // Gold
        'oklch(85% 0.05 250)', // Silver
        'oklch(70% 0.12 230)', // Ice blue
        'oklch(75% 0.10 80)', // Warm gold
        'oklch(90% 0.08 220)', // Light ice
    ];

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden">
            {CONFETTI_DATA.map((piece) => (
                <div
                    key={piece.id}
                    className="animate-confetti-burst absolute"
                    style={{
                        left: `${piece.x}%`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                    }}
                >
                    <div
                        className="rounded-sm"
                        style={{
                            width: piece.size,
                            height: piece.size,
                            backgroundColor: colors[piece.colorIdx],
                            transform: `rotate(${piece.rotation}deg)`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
});

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
                    <span className="flex items-center gap-1.5">
                        <span>Denkt na</span>
                        <ThinkingDots />
                    </span>
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
}: {
    question: QuestionItem;
    isOwn: boolean;
    isNew: boolean;
    playerColorIdx: number;
}) {
    const initials = getInitials(question.player.name);
    const isYes = question.answer === 'yes';
    const isUnclear = question.answer === 'unclear';
    const isWinner = question.answer === 'winner';
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
                            {question.player.avatar_url ? (
                                <img
                                    src={question.player.avatar_url}
                                    alt={question.player.name}
                                    className="size-7 shrink-0 rounded-full object-cover ring-2 ring-background"
                                />
                            ) : (
                                <div
                                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ backgroundColor: playerColor }}
                                >
                                    {initials}
                                </div>
                            )}
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
                    ) : (
                        <Snowflake className="size-4 text-primary/60" />
                    )}
                </div>
                <div
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm font-semibold shadow-sm',
                        'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in',
                        isWinner
                            ? 'bg-gradient-to-r from-amber-400/25 to-amber-500/15 text-amber-600 dark:text-amber-400'
                            : isYes
                              ? 'bg-gradient-to-r from-success/20 to-success/10 text-success'
                              : isUnclear
                                ? 'bg-gradient-to-r from-muted/60 to-muted/40 text-muted-foreground'
                                : 'bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive',
                    )}
                >
                    {isWinner ? (
                        <>
                            <Trophy className="size-4" />
                            <span>Correct! 🎉</span>
                        </>
                    ) : isYes ? (
                        <>
                            <Check className="size-4" />
                            <span>Ja</span>
                        </>
                    ) : isUnclear ? (
                        <>
                            <Snowflake className="size-4" />
                            <span>Onduidelijk</span>
                        </>
                    ) : (
                        <>
                            <X className="size-4" />
                            <span>Nee</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
