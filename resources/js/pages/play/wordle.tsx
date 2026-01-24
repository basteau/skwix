import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PlayLayout from '@/layouts/play-layout';

interface GuessResult {
    letter: string;
    status: 'correct' | 'present' | 'absent';
}

interface Guess {
    word: string;
    result: GuessResult[];
}

interface Props {
    player?: {
        id: number;
        name: string;
        points: number;
    };
    game?: {
        id: number;
        day_number: number;
    };
    wordle?: {
        available: boolean;
        completed: boolean;
        guesses: Guess[];
        points_earned: number;
    };
    error?: string;
}

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

export default function WordlePage({ player, game, wordle, error }: Props) {
    const [currentGuess, setCurrentGuess] = useState('');
    const [guesses, setGuesses] = useState<Guess[]>(wordle?.guesses ?? []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shakeRow, setShakeRow] = useState(false);
    const [revealingRow, setRevealingRow] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const isCompleted = wordle?.completed ?? false;
    const isAvailable = wordle?.available ?? false;

    const letterStates = useMemo(() => {
        const states: Record<string, 'correct' | 'present' | 'absent'> = {};
        for (const guess of guesses) {
            for (const { letter, status } of guess.result) {
                const current = states[letter];
                if (status === 'correct') {
                    states[letter] = 'correct';
                } else if (status === 'present' && current !== 'correct') {
                    states[letter] = 'present';
                } else if (!current) {
                    states[letter] = 'absent';
                }
            }
        }
        return states;
    }, [guesses]);

    const submitGuess = useCallback(async () => {
        if (currentGuess.length !== 5) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/play/wordle/guess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ guess: currentGuess }),
            });

            const data = await response.json();

            if (!response.ok) {
                setShakeRow(true);
                setMessage(data.message || 'Ongeldig woord');
                setTimeout(() => setShakeRow(false), 500);
                setTimeout(() => setMessage(null), 2000);
                return;
            }

            const newGuess: Guess = {
                word: currentGuess,
                result: data.result,
            };

            setRevealingRow(guesses.length);
            setTimeout(() => {
                setGuesses((prev) => [...prev, newGuess]);
                setCurrentGuess('');
                setRevealingRow(null);

                if (data.completed) {
                    if (data.correct) {
                        setMessage(`Gefeliciteerd! +${data.points_earned} punten`);
                    } else {
                        setMessage(`Helaas! +${data.points_earned} punten`);
                    }
                    setTimeout(() => router.reload(), 2000);
                }
            }, 750);
        } catch {
            setMessage('Er ging iets mis');
            setTimeout(() => setMessage(null), 2000);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentGuess, guesses.length]);

    const handleKey = useCallback(
        (key: string) => {
            if (isSubmitting || isCompleted || !isAvailable) return;

            if (key === 'backspace') {
                setCurrentGuess((prev) => prev.slice(0, -1));
            } else if (key === 'enter') {
                if (currentGuess.length !== 5) {
                    setShakeRow(true);
                    setMessage('Woord moet 5 letters zijn');
                    setTimeout(() => setShakeRow(false), 500);
                    setTimeout(() => setMessage(null), 2000);
                    return;
                }
                submitGuess();
            } else if (currentGuess.length < 5 && /^[a-z]$/.test(key)) {
                setCurrentGuess((prev) => prev + key);
            }
        },
        [currentGuess, isSubmitting, isCompleted, isAvailable, submitGuess]
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.key === 'Backspace') {
                e.preventDefault();
                handleKey('backspace');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleKey('enter');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                handleKey(e.key.toLowerCase());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKey]);

    if (error === 'no_active_game') {
        return (
            <PlayLayout>
                <Head title="Wordle" />
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Geen actief spel</h1>
                    <p className="mt-2 text-muted-foreground">
                        Wacht tot de beheerder een spel start.
                    </p>
                </div>
            </PlayLayout>
        );
    }

    const states = letterStates;

    return (
        <PlayLayout>
            <Head title="Wordle" />
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Dag {game?.day_number ?? 1}</span>
                    <span className="font-semibold text-foreground">{player?.points ?? 0} punten</span>
                </header>

                {/* Message */}
                {message && (
                    <div className="mx-4 mt-3 rounded-md bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary">
                        {message}
                    </div>
                )}

                {/* Grid */}
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-6">
                    {[...Array(6)].map((_, rowIdx) => {
                        const guess = guesses[rowIdx];
                        const isCurrentRow = rowIdx === guesses.length && !isCompleted;
                        const isRevealing = revealingRow === rowIdx;

                        return (
                            <div
                                key={rowIdx}
                                className={`flex gap-1.5 ${isCurrentRow && shakeRow ? 'animate-shake' : ''}`}
                            >
                                {[...Array(5)].map((_, colIdx) => {
                                    let letter = '';
                                    let status: 'empty' | 'filled' | 'correct' | 'present' | 'absent' = 'empty';

                                    if (guess) {
                                        letter = guess.result[colIdx]?.letter ?? '';
                                        status = guess.result[colIdx]?.status ?? 'absent';
                                    } else if (isCurrentRow) {
                                        letter = currentGuess[colIdx] ?? '';
                                        status = letter ? 'filled' : 'empty';
                                    }

                                    return (
                                        <Tile
                                            key={colIdx}
                                            letter={letter}
                                            status={status}
                                            delay={isRevealing ? colIdx * 150 : undefined}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Completed state */}
                {isCompleted && (
                    <div className="px-4 pb-4 text-center">
                        <p className="text-lg font-semibold text-primary">
                            +{wordle?.points_earned} punten verdiend!
                        </p>
                        <p className="text-sm text-muted-foreground">Morgen weer een nieuwe</p>
                    </div>
                )}

                {/* Not available state */}
                {!isAvailable && !isCompleted && (
                    <div className="px-4 pb-4 text-center">
                        <p className="text-muted-foreground">Wordle beschikbaar om 8:00</p>
                    </div>
                )}

                {/* Keyboard */}
                {isAvailable && !isCompleted && (
                    <div className="mt-auto px-2 pb-4 pb-safe">
                        <div className="flex flex-col gap-1.5">
                            {KEYBOARD_ROWS.map((row, rowIdx) => (
                                <div key={rowIdx} className="flex justify-center gap-1">
                                    {row.map((key) => (
                                        <KeyboardKey
                                            key={key}
                                            keyVal={key}
                                            state={states[key]}
                                            onPress={handleKey}
                                            disabled={isSubmitting}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PlayLayout>
    );
}

function Tile({
    letter,
    status,
    delay,
}: {
    letter: string;
    status: 'empty' | 'filled' | 'correct' | 'present' | 'absent';
    delay?: number;
}) {
    const baseClasses =
        'flex size-[58px] items-center justify-center rounded-sm border-2 text-2xl font-bold uppercase transition-colors';

    const statusClasses = {
        empty: 'border-border bg-background text-foreground',
        filled: 'border-border-strong bg-background text-foreground animate-pop',
        correct: 'border-transparent bg-wordle-correct text-white',
        present: 'border-transparent bg-wordle-present text-white',
        absent: 'border-transparent bg-wordle-absent text-white',
    };

    const style = delay !== undefined ? { animationDelay: `${delay}ms` } : undefined;

    return (
        <div
            className={`${baseClasses} ${statusClasses[status]} ${delay !== undefined ? 'animate-flip' : ''}`}
            style={style}
        >
            {letter}
        </div>
    );
}

function KeyboardKey({
    keyVal,
    state,
    onPress,
    disabled,
}: {
    keyVal: string;
    state?: 'correct' | 'present' | 'absent';
    onPress: (key: string) => void;
    disabled: boolean;
}) {
    const isSpecial = keyVal === 'enter' || keyVal === 'backspace';
    const label = keyVal === 'backspace' ? '←' : keyVal === 'enter' ? 'Enter' : keyVal;

    const baseClasses =
        'flex h-[43px] items-center justify-center rounded-sm text-sm font-semibold uppercase transition-colors active:scale-95';

    const widthClass = isSpecial ? 'min-w-[65px] px-2' : 'min-w-[32px]';

    const stateClasses = {
        correct: 'bg-wordle-correct text-white',
        present: 'bg-wordle-present text-white',
        absent: 'bg-wordle-absent text-white',
        default: 'bg-muted text-foreground',
    };

    return (
        <button
            type="button"
            onClick={() => onPress(keyVal)}
            disabled={disabled}
            className={`${baseClasses} ${widthClass} ${stateClasses[state ?? 'default']} disabled:opacity-50`}
        >
            {label}
        </button>
    );
}
