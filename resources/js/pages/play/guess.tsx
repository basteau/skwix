import { Head, router } from '@inertiajs/react';
import Check from 'lucide-react/icons/check';
import X from 'lucide-react/icons/x';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayHeader } from '@/components/play-header';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/hooks/use-initials';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';

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
}

const QUESTION_COST = 3;

export default function GuessPage({ player, game, questions: initialQuestions = [], error }: Props) {
    const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [points, setPoints] = useState(player?.points ?? 0);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const canAsk = points >= QUESTION_COST && input.trim().length >= 3;

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [questions]);

    const handleSubmit = useCallback(async () => {
        if (!canAsk || isSubmitting) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/play/guess/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ question: input.trim() }),
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
                return;
            }

            setQuestions((prev) => [...prev, data.question]);
            setPoints(data.points_remaining);
            setInput('');
            inputRef.current?.focus();
        } catch {
            setMessage({ type: 'error', text: 'Verbinding mislukt' });
        } finally {
            setIsSubmitting(false);
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
                    <h1 className="text-2xl font-bold text-foreground">Geen actief spel</h1>
                    <p className="mt-2 text-muted-foreground">
                        Wacht tot de beheerder een spel start.
                    </p>
                </div>
            </PlayLayout>
        );
    }

    return (
        <PlayLayout>
            <Head title="Vraag" />
            <div className="flex h-full flex-col">
                <PlayHeader title="Mystery Woord" points={points} testId="guess-points-display" />

                {/* Message */}
                {message && (
                    <div
                        className={cn(
                            'mx-4 mt-3 rounded-md px-4 py-2 text-center text-sm font-medium',
                            message.type === 'error'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-primary/10 text-primary'
                        )}
                    >
                        {message.text}
                    </div>
                )}

                {/* Question History */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto px-4 py-4"
                >
                    {questions.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center px-4">
                            <span className="font-display text-6xl font-bold text-primary/20">?</span>
                            <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
                                Stel ja/nee vragen om het mystery woord te raden.
                                <br />
                                <span className="text-foreground">Elke vraag kost {QUESTION_COST} punten.</span>
                            </p>
                            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
                                <p className="text-center text-sm italic text-muted-foreground">
                                    "Is het een dier?"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div data-testid="guess-history" className="space-y-4">
                            {questions.map((q, idx) => (
                                <QuestionBubble
                                    key={q.id}
                                    question={q}
                                    isOwn={q.player.id === player?.id}
                                    isNew={idx === questions.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-border bg-background px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            data-testid="guess-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Stel een ja/nee vraag..."
                            disabled={isSubmitting || points < QUESTION_COST}
                            className="h-11 flex-1 rounded-md border border-border-strong bg-card px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        />
                        <Button
                            data-testid="guess-submit-button"
                            onClick={handleSubmit}
                            disabled={!canAsk || isSubmitting}
                            className="shrink-0"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="size-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                </span>
                            ) : (
                                `Vraag (${QUESTION_COST})`
                            )}
                        </Button>
                    </div>
                    {points < QUESTION_COST && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            Je hebt {QUESTION_COST} punten nodig om een vraag te stellen
                        </p>
                    )}
                </div>
            </div>
        </PlayLayout>
    );
}

function QuestionBubble({
    question,
    isOwn,
    isNew,
}: {
    question: QuestionItem;
    isOwn: boolean;
    isNew: boolean;
}) {
    const initials = getInitials(question.player.name);
    const isYes = question.answer === 'yes';

    return (
        <div
            data-testid={`guess-item-${question.id}`}
            className={cn(
                'motion-safe:transition-all',
                isNew && 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300'
            )}
        >
            {/* Question */}
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                    {question.player.avatar_url ? (
                        <img
                            src={question.player.avatar_url}
                            alt={question.player.name}
                            className="size-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                            {initials}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-muted-foreground">
                        {isOwn ? 'Jij' : question.player.name}
                    </span>
                    <p className="mt-0.5 text-sm text-foreground">{question.question}</p>
                </div>
            </div>

            {/* Answer */}
            <div className="ml-11 mt-2">
                <div
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
                        isYes ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                    )}
                >
                    {isYes ? <Check className="size-4" /> : <X className="size-4" />}
                    <span className="text-sm font-semibold">
                        {isYes ? 'Ja' : 'Nee'}
                    </span>
                </div>
            </div>
        </div>
    );
}
