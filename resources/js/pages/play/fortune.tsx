import { Head } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';

interface SpinRecord {
    id: number;
    amount: number;
    won: boolean;
    points_change: number;
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
    recentSpins?: SpinRecord[];
    error?: string;
}

const SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / SEGMENTS;
const LIGHTS_COUNT = 24;

export default function FortunePage({ player, game, recentSpins: initialSpins = [], error }: Props) {
    const [points, setPoints] = useState(player?.points ?? 0);
    const [wager, setWager] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<{ won: boolean; change: number } | null>(null);
    const [recentSpins, setRecentSpins] = useState<SpinRecord[]>(initialSpins);
    const [showCelebration, setShowCelebration] = useState(false);

    const wagerAmount = parseInt(wager, 10) || 0;
    const canSpin = points > 0 && wagerAmount >= 1 && wagerAmount <= points && !isSpinning;

    const handleSpin = useCallback(async () => {
        if (!canSpin) return;

        setIsSpinning(true);
        setResult(null);
        setShowCelebration(false);

        try {
            const response = await fetch('/play/fortune/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ wager: wagerAmount }),
            });

            const data = await response.json();

            if (!response.ok) {
                setIsSpinning(false);
                return;
            }

            setRotation((prev) => prev + data.spin_degrees);

            setTimeout(() => {
                setResult({ won: data.won, change: data.points_change });
                setPoints(data.points_remaining);
                setRecentSpins((prev) => [data.spin_result, ...prev.slice(0, 4)]);
                setWager('');
                setIsSpinning(false);
                if (data.won) {
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 2000);
                }
            }, 3500);
        } catch {
            setIsSpinning(false);
        }
    }, [canSpin, wagerAmount]);

    if (error === 'no_active_game') {
        return (
            <PlayLayout>
                <Head title="Rad" />
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
            <Head title="Rad" />
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-border px-4 py-3 pt-[var(--safe-top)]">
                    <span className="font-display text-lg font-bold text-foreground">Rad van Fortuin</span>
                    <span data-testid="fortune-points-display" className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">
                        {points} punten
                    </span>
                </header>

                {/* Wheel Area */}
                <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-6">
                    {/* Celebration confetti */}
                    {showCelebration && (
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-confetti"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 500}ms`,
                                        animationDuration: `${2 + Math.random()}s`,
                                    }}
                                >
                                    <div
                                        className="size-2 rounded-sm"
                                        style={{
                                            backgroundColor: ['var(--success)', 'var(--warning)', 'var(--primary)', 'var(--secondary)'][Math.floor(Math.random() * 4)],
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Wheel Container */}
                    <div className="relative">
                        {/* Pointer - SVG with shadow */}
                        <div
                            className={cn(
                                'absolute -top-3 left-1/2 z-20 -translate-x-1/2 drop-shadow-md transition-transform',
                                result && !isSpinning && 'motion-safe:animate-bounce'
                            )}
                            style={{ animationIterationCount: result ? 2 : undefined }}
                        >
                            <svg width="24" height="28" viewBox="0 0 24 28" className="drop-shadow-md">
                                <defs>
                                    <linearGradient id="pointer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.9" />
                                        <stop offset="50%" stopColor="var(--foreground)" />
                                        <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.9" />
                                    </linearGradient>
                                </defs>
                                <path d="M12 0 L24 24 L12 20 L0 24 Z" fill="url(#pointer-gradient)" />
                            </svg>
                        </div>

                        {/* Outer ring with lights */}
                        <div className="absolute inset-0 -m-4">
                            <div className="relative size-full">
                                {Array.from({ length: LIGHTS_COUNT }).map((_, i) => {
                                    const angle = (i * 360) / LIGHTS_COUNT;
                                    const rad = (angle * Math.PI) / 180;
                                    const x = 50 + 48 * Math.cos(rad);
                                    const y = 50 + 48 * Math.sin(rad);
                                    const isLit = isSpinning ? i % 3 === Math.floor(Date.now() / 100) % 3 : true;
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                'absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity',
                                                isLit ? 'bg-primary opacity-80' : 'bg-border opacity-40'
                                            )}
                                            style={{ left: `${x}%`, top: `${y}%` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Wheel */}
                        <div
                            data-testid="fortune-wheel"
                            className={cn(
                                'relative size-[260px] rounded-full shadow-xl transition-transform',
                                result?.won && 'motion-safe:animate-pulse'
                            )}
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transitionDuration: isSpinning ? '3.5s' : '0s',
                                transitionTimingFunction: 'cubic-bezier(0.1, 0.8, 0.2, 1)',
                                boxShadow: '0 8px 32px var(--color-primary) / 0.2, inset 0 2px 4px rgba(255,255,255,0.1)',
                            }}
                        >
                            <svg viewBox="0 0 100 100" className="size-full">
                                <defs>
                                    <radialGradient id="wheel-sheen" cx="30%" cy="30%" r="70%">
                                        <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                                    </radialGradient>
                                    <linearGradient id="win-segment" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--color-wheel-win)" />
                                        <stop offset="100%" stopColor="oklch(40% 0.15 230)" />
                                    </linearGradient>
                                    <linearGradient id="lose-segment" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--color-wheel-lose)" />
                                        <stop offset="100%" stopColor="oklch(55% 0.02 250)" />
                                    </linearGradient>
                                </defs>
                                
                                {/* Segments */}
                                {Array.from({ length: SEGMENTS }).map((_, i) => {
                                    const isWin = i % 2 === 0;
                                    const startAngle = i * SEGMENT_ANGLE - 90;
                                    const endAngle = startAngle + SEGMENT_ANGLE;
                                    const path = describeArc(50, 50, 48, startAngle, endAngle);

                                    return (
                                        <path
                                            key={i}
                                            d={path}
                                            fill={isWin ? 'url(#win-segment)' : 'url(#lose-segment)'}
                                            stroke="var(--color-border)"
                                            strokeWidth="0.5"
                                        />
                                    );
                                })}
                                
                                {/* Sheen overlay */}
                                <circle cx="50" cy="50" r="48" fill="url(#wheel-sheen)" />
                                
                                {/* Segment labels */}
                                {Array.from({ length: SEGMENTS }).map((_, i) => {
                                    const isWin = i % 2 === 0;
                                    const angle = (i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90) * (Math.PI / 180);
                                    const x = 50 + 30 * Math.cos(angle);
                                    const y = 50 + 30 * Math.sin(angle);
                                    const textRotation = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

                                    return (
                                        <text
                                            key={`text-${i}`}
                                            x={x}
                                            y={y}
                                            fill="white"
                                            fontSize="7"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform={`rotate(${textRotation}, ${x}, ${y})`}
                                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                        >
                                            {isWin ? '2×' : '0'}
                                        </text>
                                    );
                                })}
                                
                                {/* Center hub */}
                                <circle cx="50" cy="50" r="10" fill="var(--color-background)" stroke="var(--color-border-strong)" strokeWidth="2" />
                                <circle cx="50" cy="50" r="6" fill="var(--color-primary)" />
                                <circle cx="48" cy="48" r="2" fill="white" fillOpacity="0.4" />
                            </svg>
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            data-testid="fortune-result"
                            className={cn(
                                'mt-8 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300',
                                result.won && 'motion-safe:animate-pulse'
                            )}
                        >
                            <p
                                className={cn(
                                    'font-display text-4xl font-bold',
                                    result.won ? 'text-success' : 'text-muted-foreground'
                                )}
                            >
                                {result.won ? `+${result.change}` : result.change}
                            </p>
                            <p className={cn('mt-1 text-sm', result.won ? 'text-success' : 'text-muted-foreground')}>
                                {result.won ? 'Gewonnen! 🎉' : 'Helaas...'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="border-t border-border bg-background px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-4">
                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Inzet
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                data-testid="fortune-wager-input"
                                value={wager}
                                onChange={(e) => setWager(e.target.value)}
                                placeholder="0"
                                min={1}
                                max={points}
                                disabled={isSpinning || points === 0}
                                className="h-11 flex-1 rounded-md border border-border-strong bg-card px-3 text-center text-base font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            />
                            <Button
                                data-testid="fortune-half-button"
                                variant="outline"
                                onClick={() => setWager(Math.floor(points / 2).toString())}
                                disabled={isSpinning || points === 0}
                                className="shrink-0"
                            >
                                50%
                            </Button>
                            <Button
                                data-testid="fortune-max-button"
                                variant="outline"
                                onClick={() => setWager(points.toString())}
                                disabled={isSpinning || points === 0}
                                className="shrink-0"
                            >
                                Max
                            </Button>
                        </div>
                    </div>

                    <Button
                        data-testid="fortune-spin-button"
                        onClick={handleSpin}
                        disabled={!canSpin}
                        className="w-full"
                        size="lg"
                    >
                        {isSpinning ? 'Draait...' : 'Draai het rad'}
                    </Button>

                    {points === 0 && (
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Je hebt geen punten om in te zetten
                        </p>
                    )}
                </div>
            </div>
        </PlayLayout>
    );
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        'M', cx, cy,
        'L', start.x, start.y,
        'A', r, r, 0, largeArc, 0, end.x, end.y,
        'Z',
    ].join(' ');
}
