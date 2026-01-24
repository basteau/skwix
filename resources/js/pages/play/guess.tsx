import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import PlayLayout from '@/layouts/play-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
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
                {/* Header */}
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Mystery Woord</span>
                    <span className="font-semibold text-foreground">{points} punten</span>
                </header>

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
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="mb-4 rounded-full bg-primary/10 p-4">
                                <svg
                                    className="size-8 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Nog geen vragen
                            </h2>
                            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                Stel ja/nee vragen over het mystery woord.
                                Elke vraag kost {QUESTION_COST} punten.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <QuestionCard
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
                <div className="border-t border-border bg-background px-4 pb-safe pt-3">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Stel een ja/nee vraag..."
                            disabled={isSubmitting || points < QUESTION_COST}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <Button
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

function QuestionCard({
    question,
    isOwn,
    isNew,
}: {
    question: QuestionItem;
    isOwn: boolean;
    isNew: boolean;
}) {
    const initials = question.player.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div
            className={cn(
                'rounded-lg border border-border bg-card p-3 transition-all',
                isNew && 'animate-in fade-in slide-in-from-bottom-2 duration-300'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0">
                    {question.player.avatar_url ? (
                        <img
                            src={question.player.avatar_url}
                            alt={question.player.name}
                            className="size-10 rounded-full border-2 border-border object-cover"
                        />
                    ) : (
                        <div className="flex size-10 items-center justify-center rounded-full border-2 border-border bg-primary-light text-xs font-semibold text-primary">
                            {initials}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                            {isOwn ? 'Jij' : question.player.name}
                        </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground">{question.question}</p>
                </div>

                {/* Answer Badge */}
                <div
                    className={cn(
                        'shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold text-white',
                        question.answer === 'yes' ? 'bg-success' : 'bg-destructive'
                    )}
                >
                    {question.answer === 'yes' ? 'Ja' : 'Nee'}
                </div>
            </div>
        </div>
    );
}
