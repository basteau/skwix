import { PlayHeader } from '@/components/play-header';
import { TestModeBanner } from '@/components/test-mode-banner';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/hooks/use-initials';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { Check, Search, Snowflake, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QuestionItem {
    id: number;
    question: string;
    answer: 'yes' | 'no';
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
    };
    game?: {
        id: number;
        status: string;
    };
    questions?: QuestionItem[];
    error?: string;
    testMode?: { active: boolean; secretWord?: string };
}

const QUESTION_COST = 3;

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
    questions: initialQuestions = [],
    error,
    testMode,
}: Props) {
    const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
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

    const canAsk = points >= QUESTION_COST && input.trim().length >= 3;

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [questions, pendingQuestion]);

    const handleSubmit = useCallback(async () => {
        if (!canAsk || isSubmitting) return;

        const questionText = input.trim();
        setIsSubmitting(true);
        setMessage(null);
        setPendingQuestion(questionText);
        setInput('');

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

            const data = await response.json();

            if (!response.ok) {
                const errorMessages: Record<string, string> = {
                    insufficient_points: 'Niet genoeg punten',
                    game_not_active: 'Spel is niet actief',
                    ai_error: data.message || 'Er ging iets mis',
                };
                setMessage({
                    type: 'error',
                    text: errorMessages[data.error] || 'Er ging iets mis',
                });
                setInput(questionText);
                return;
            }

            setQuestions((prev) => [...prev, data.question]);
            setPoints(data.points_remaining);
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
        return (
            <PlayLayout>
                <Head title="Vraag" />
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        Geen actief spel
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Wacht tot de beheerder een spel start.
                    </p>
                </div>
            </PlayLayout>
        );
    }

    const questionsRemaining = Math.floor(points / QUESTION_COST);

    return (
        <PlayLayout>
            <Head title="Vraag" />
            <div className="relative flex h-full flex-col overflow-hidden">
                {testMode?.active && <TestModeBanner wordleWord={testMode.secretWord} />}

                {/* Background snowflakes */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {SNOWFLAKES.map((flake, i) => (
                        <div
                            key={i}
                            className="absolute animate-snow-fall"
                            style={{
                                left: `${flake.left}%`,
                                animationDelay: `${flake.delay}ms`,
                                animationDuration: `${flake.duration}s`,
                                opacity: flake.opacity,
                            }}
                        >
                            <Snowflake
                                className="text-primary/40"
                                style={{ width: flake.size, height: flake.size }}
                            />
                        </div>
                    ))}
                </div>

                <PlayHeader
                    title="Mystery Woord"
                    points={points}
                    testId="guess-points-display"
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

                {/* Question History */}
                <div ref={listRef} className="relative flex-1 overflow-y-auto">
                    {questions.length === 0 && !pendingQuestion ? (
                        <EmptyState questionsRemaining={questionsRemaining} />
                    ) : (
                        <div data-testid="guess-history" className="px-4 py-4">
                            <div className="space-y-3">
                                {questions.map((q, idx) => (
                                    <QuestionBubble
                                        key={q.id}
                                        question={q}
                                        isOwn={q.player.id === player?.id}
                                        isNew={idx === questions.length - 1 && !pendingQuestion}
                                        playerColorIdx={q.player.id % PLAYER_COLORS.length}
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

                {/* Input Area */}
                <div className="relative z-10 border-t border-border/80 bg-gradient-to-b from-card to-background px-4 pt-4 pb-[calc(var(--safe-bottom)+1rem)]">
                    {/* Question cost indicator */}
                    <div className="mb-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Sparkles className="size-3.5" />
                            {questionsRemaining} {questionsRemaining === 1 ? 'vraag' : 'vragen'} over
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
                                placeholder="Stel een ja/nee vraag..."
                                disabled={isSubmitting || points < QUESTION_COST}
                                className={cn(
                                    'h-12 w-full rounded-xl border-2 border-border/60 bg-card pl-4 pr-12 text-base',
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
                            {isSubmitting ? (
                                <ThinkingDots />
                            ) : (
                                'Vraag'
                            )}
                        </Button>
                    </div>

                    {points < QUESTION_COST && (
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Je hebt {QUESTION_COST} punten nodig om een vraag te stellen
                        </p>
                    )}
                </div>
            </div>
        </PlayLayout>
    );
}

function EmptyState({ questionsRemaining }: { questionsRemaining: number }) {
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
                Stel ja/nee vragen om het geheime woord te ontdekken.
            </p>

            {/* Example hints */}
            <div className="mt-6 space-y-2">
                <ExampleHint emoji="🐾" text="Is het een dier?" />
                <ExampleHint emoji="🏠" text="Vind je het in huis?" />
                <ExampleHint emoji="❄️" text="Is het koud?" />
            </div>

            {questionsRemaining > 0 && (
                <div className="mt-8 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                        Je kunt {questionsRemaining} {questionsRemaining === 1 ? 'vraag' : 'vragen'} stellen
                    </span>
                </div>
            )}
        </div>
    );
}

function ExampleHint({ emoji, text }: { emoji: string; text: string }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5">
            <span className="text-lg">{emoji}</span>
            <span className="text-sm text-muted-foreground italic">"{text}"</span>
        </div>
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
                    <Snowflake className="size-4 animate-spin text-primary/60" style={{ animationDuration: '3s' }} />
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
    const playerColor = PLAYER_COLORS[playerColorIdx];

    return (
        <div
            data-testid={`guess-item-${question.id}`}
            className={cn(
                isNew && 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300',
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
                    <Snowflake className="size-4 text-primary/60" />
                </div>
                <div
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-2 text-sm font-semibold shadow-sm',
                        'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95',
                        isYes
                            ? 'bg-gradient-to-r from-success/20 to-success/10 text-success'
                            : 'bg-gradient-to-r from-destructive/15 to-destructive/5 text-destructive',
                    )}
                >
                    {isYes ? (
                        <Check className="size-4" />
                    ) : (
                        <X className="size-4" />
                    )}
                    <span>{isYes ? 'Ja' : 'Nee'}</span>
                </div>
            </div>
        </div>
    );
}
