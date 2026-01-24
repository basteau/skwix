import { PlayHeader } from '@/components/play-header';
import { TestModeBanner } from '@/components/test-mode-banner';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { Snowflake, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface GuessResult {
    letter: string;
    status: 'correct' | 'present' | 'absent';
}

interface Guess {
    word: string;
    result: GuessResult[];
}

interface Props {
    testMode?: {
        active: boolean;
        wordleWord?: string;
    };
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

const CONFETTI_DATA = Array.from({ length: 24 }).map((_, i) => ({
    left: (i * 4.5 + ((i * 13) % 8)) % 100,
    delay: (i * 30) % 400,
    duration: 2 + (i % 3) * 0.3,
    colorIdx: i % 5,
    size: 5 + (i % 3) * 2,
    rotation: (i * 45) % 360,
}));

const SNOWFLAKES = Array.from({ length: 8 }).map((_, i) => ({
    left: (i * 12 + ((i * 17) % 12)) % 100,
    delay: (i * 600) % 3000,
    duration: 10 + (i % 4) * 3,
    size: 10 + (i % 3) * 4,
    opacity: 0.08 + (i % 3) * 0.04,
}));

export default function WordlePage({ testMode, player, game, wordle, error }: Props) {
    const [currentGuess, setCurrentGuess] = useState('');
    const [guesses, setGuesses] = useState<Guess[]>(wordle?.guesses ?? []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shakeRow, setShakeRow] = useState(false);
    const [revealingRow, setRevealingRow] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [popTile, setPopTile] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [displayPoints, setDisplayPoints] = useState(player?.points ?? 0);

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
                    'X-CSRF-TOKEN': getCsrfToken(),
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
                        setShowCelebration(true);
                        setMessage(`Gefeliciteerd! +${data.points_earned} punten`);
                        animatePoints(displayPoints, displayPoints + data.points_earned);
                        setTimeout(() => setShowCelebration(false), 3000);
                    } else {
                        setMessage(`Helaas! +${data.points_earned} punten`);
                        animatePoints(displayPoints, displayPoints + data.points_earned);
                    }
                    setTimeout(() => router.reload(), 2500);
                }
            }, 750);
        } catch {
            setMessage('Er ging iets mis');
            setTimeout(() => setMessage(null), 2000);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentGuess, guesses.length, displayPoints]);

    const animatePoints = (from: number, to: number) => {
        const duration = 600;
        const steps = 20;
        const increment = (to - from) / steps;
        let current = from;
        const interval = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= to) || (increment < 0 && current <= to)) {
                setDisplayPoints(to);
                clearInterval(interval);
            } else {
                setDisplayPoints(Math.round(current));
            }
        }, duration / steps);
    };

    const triggerHaptic = useCallback(() => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }, []);

    const handleKey = useCallback(
        (key: string) => {
            if (isSubmitting || isCompleted || !isAvailable) return;

            triggerHaptic();

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
                setPopTile(currentGuess.length);
                setTimeout(() => setPopTile(null), 100);
                setCurrentGuess((prev) => prev + key);
            }
        },
        [currentGuess, isSubmitting, isCompleted, isAvailable, submitGuess, triggerHaptic],
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

    const states = letterStates;

    return (
        <PlayLayout>
            <Head title="Wordle" />
            <div className="relative flex h-full flex-col overflow-hidden">
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

                {/* Celebration confetti */}
                {showCelebration && (
                    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
                        {CONFETTI_DATA.map((conf, i) => (
                            <div
                                key={i}
                                className="absolute animate-confetti-burst"
                                style={{
                                    left: `${conf.left}%`,
                                    animationDelay: `${conf.delay}ms`,
                                    animationDuration: `${conf.duration}s`,
                                }}
                            >
                                <div
                                    className="rounded-sm"
                                    style={{
                                        width: conf.size,
                                        height: conf.size,
                                        backgroundColor: [
                                            'oklch(65% 0.2 145)',
                                            'oklch(70% 0.18 85)',
                                            'oklch(60% 0.15 230)',
                                            'oklch(75% 0.12 200)',
                                            'oklch(85% 0.08 60)',
                                        ][conf.colorIdx],
                                        transform: `rotate(${conf.rotation}deg)`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Test Mode Banner */}
                {testMode?.active && (
                    <TestModeBanner wordleWord={testMode.wordleWord} />
                )}

                {/* Header with animated points */}
                <PlayHeader
                    title="Wordle"
                    subtitle={testMode?.active ? `Test Dag ${game?.day_number ?? 1}` : `Dag ${game?.day_number ?? 1}`}
                    points={displayPoints}
                />

                {/* Message toast - only show when not in completed state (avoids duplicate with completion section) */}
                {message && !isCompleted && (
                    <div
                        data-testid="wordle-message"
                        className={cn(
                            'mx-4 mt-3 rounded-lg px-4 py-2.5 text-center text-sm font-semibold',
                            'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2',
                            showCelebration
                                ? 'bg-gradient-to-r from-success/15 to-success/5 text-success'
                                : 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary',
                        )}
                    >
                        {showCelebration && <Sparkles className="mr-2 inline-block size-4" />}
                        {message}
                    </div>
                )}

                {/* Grid */}
                <div
                    data-testid="wordle-grid"
                    className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-4"
                >
                    {[...Array(6)].map((_, rowIdx) => {
                        const guess = guesses[rowIdx];
                        const isCurrentRow = rowIdx === guesses.length && !isCompleted;
                        const isRevealing = revealingRow === rowIdx;

                        return (
                            <div
                                key={rowIdx}
                                className={cn(
                                    'flex gap-1',
                                    isCurrentRow && shakeRow && 'animate-shake',
                                    isCurrentRow && 'rounded-lg ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
                                )}
                            >
                                {[...Array(5)].map((_, colIdx) => {
                                    let letter = '';
                                    let status:
                                        | 'empty'
                                        | 'filled'
                                        | 'correct'
                                        | 'present'
                                        | 'absent' = 'empty';

                                    if (guess) {
                                        letter = guess.result[colIdx]?.letter ?? '';
                                        status = guess.result[colIdx]?.status ?? 'absent';
                                    } else if (isCurrentRow) {
                                        letter = currentGuess[colIdx] ?? '';
                                        status = letter ? 'filled' : 'empty';
                                    }

                                    const shouldPop = isCurrentRow && popTile === colIdx && letter;

                                    return (
                                        <Tile
                                            key={colIdx}
                                            letter={letter}
                                            status={status}
                                            delay={isRevealing ? colIdx * 150 : undefined}
                                            pop={shouldPop}
                                            testId={`wordle-tile-r${rowIdx}-c${colIdx}`}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Completed state */}
                {isCompleted && (
                    <div className="px-4 pb-4 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-success/15 to-success/5 px-6 py-3">
                            <Sparkles className="size-5 text-success" />
                            <span className="font-display text-xl font-bold text-success">
                                +{wordle?.points_earned} punten
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Morgen weer een nieuwe
                        </p>
                    </div>
                )}

                {/* Not available state */}
                {!isAvailable && !isCompleted && (
                    <div className="px-4 pb-4 text-center">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
                            <Snowflake className="size-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                                Wordle beschikbaar om 8:00
                            </span>
                        </div>
                    </div>
                )}

                {/* Keyboard */}
                {isAvailable && !isCompleted && (
                    <div className="border-t border-border bg-gradient-to-b from-muted/30 to-muted/60 px-1.5 pt-3 pb-[calc(var(--safe-bottom)+0.75rem)]">
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
                                            testId={`wordle-key-${key}`}
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
    pop,
    testId,
}: {
    letter: string;
    status: 'empty' | 'filled' | 'correct' | 'present' | 'absent';
    delay?: number;
    pop?: boolean;
    testId?: string;
}) {
    const baseClasses = cn(
        'flex size-[56px] items-center justify-center rounded-md text-[1.75rem] font-bold uppercase',
        'transition-all duration-200',
    );

    const statusClasses = {
        empty: 'border-2 border-dashed border-border/60 bg-background/50 text-foreground',
        filled: cn(
            'border-2 border-primary/40 bg-card text-foreground shadow-sm',
            pop && 'animate-tile-pop',
        ),
        correct: 'border-0 bg-wordle-correct text-white shadow-md shadow-wordle-correct/30',
        present: 'border-0 bg-wordle-present text-white shadow-md shadow-wordle-present/30',
        absent: 'border-0 bg-wordle-absent text-white/90',
    };

    const style = delay !== undefined ? { animationDelay: `${delay}ms` } : undefined;

    return (
        <div
            data-testid={testId}
            className={cn(baseClasses, statusClasses[status], delay !== undefined && 'animate-flip-3d')}
            style={style}
        >
            <span
                className={cn(
                    status !== 'empty' && status !== 'filled' && 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]',
                )}
            >
                {letter}
            </span>
        </div>
    );
}

function KeyboardKey({
    keyVal,
    state,
    onPress,
    disabled,
    testId,
}: {
    keyVal: string;
    state?: 'correct' | 'present' | 'absent';
    onPress: (key: string) => void;
    disabled: boolean;
    testId?: string;
}) {
    const isAction = keyVal === 'enter' || keyVal === 'backspace';

    const stateClasses = {
        correct: 'bg-wordle-correct text-white shadow-sm shadow-wordle-correct/20',
        present: 'bg-wordle-present text-white shadow-sm shadow-wordle-present/20',
        absent: 'bg-wordle-absent text-white/90',
        default: 'bg-card text-foreground hover:bg-muted border border-border/50',
    };

    const baseClasses = cn(
        'flex items-center justify-center font-semibold uppercase',
        'transition-all duration-100 active:scale-[0.92] disabled:opacity-40',
        'motion-safe:active:transition-transform',
    );

    if (isAction) {
        return (
            <button
                type="button"
                data-testid={testId}
                onClick={() => onPress(keyVal)}
                disabled={disabled}
                className={cn(
                    baseClasses,
                    'min-w-[56px] h-12 rounded-md px-2 text-xs',
                    'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
                )}
            >
                {keyVal === 'backspace' ? '⌫' : '↵'}
            </button>
        );
    }

    return (
        <button
            type="button"
            data-testid={testId}
            onClick={() => onPress(keyVal)}
            disabled={disabled}
            className={cn(
                baseClasses,
                'min-w-[32px] h-12 rounded-md text-sm',
                stateClasses[state ?? 'default'],
            )}
        >
            {keyVal}
        </button>
    );
}
