import { Head } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import PlayLayout from '@/layouts/play-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export default function FortunePage({ player, game, recentSpins: initialSpins = [], error }: Props) {
    const [points, setPoints] = useState(player?.points ?? 0);
    const [wager, setWager] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<{ won: boolean; change: number } | null>(null);
    const [recentSpins, setRecentSpins] = useState<SpinRecord[]>(initialSpins);

    const wagerAmount = parseInt(wager, 10) || 0;
    const canSpin = points > 0 && wagerAmount >= 1 && wagerAmount <= points && !isSpinning;

    const handleSpin = useCallback(async () => {
        if (!canSpin) return;

        setIsSpinning(true);
        setResult(null);

        try {
            const response = await fetch('/play/fortune/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
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
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Rad van Fortuin</span>
                    <span className="font-semibold text-foreground">{points} punten</span>
                </header>

                {/* Wheel */}
                <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
                    <div className="relative">
                        {/* Pointer */}
                        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
                            <div className="size-0 border-x-8 border-t-12 border-x-transparent border-t-foreground" />
                        </div>

                        {/* Wheel */}
                        <div
                            className="relative size-[280px] rounded-full border-4 border-primary shadow-lg transition-transform"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transitionDuration: isSpinning ? '3.5s' : '0s',
                                transitionTimingFunction: 'cubic-bezier(0.1, 0.8, 0.2, 1)',
                            }}
                        >
                            <svg viewBox="0 0 100 100" className="size-full">
                                {Array.from({ length: SEGMENTS }).map((_, i) => {
                                    const isWin = i % 2 === 0;
                                    const startAngle = i * SEGMENT_ANGLE - 90;
                                    const endAngle = startAngle + SEGMENT_ANGLE;
                                    const path = describeArc(50, 50, 48, startAngle, endAngle);

                                    return (
                                        <path
                                            key={i}
                                            d={path}
                                            fill={isWin ? 'var(--wheel-win)' : 'var(--wheel-lose)'}
                                        />
                                    );
                                })}
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
                                            fontSize="6"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform={`rotate(${textRotation}, ${x}, ${y})`}
                                        >
                                            {isWin ? '2×' : '0'}
                                        </text>
                                    );
                                })}
                                <circle cx="50" cy="50" r="8" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            className={cn(
                                'mt-6 rounded-lg px-6 py-3 text-center animate-in fade-in zoom-in duration-300',
                                result.won ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                            )}
                        >
                            <p className="text-2xl font-bold">
                                {result.won ? `+${result.change}` : result.change}
                            </p>
                            <p className="text-sm">{result.won ? 'Gewonnen! 🎉' : 'Verloren...'}</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="border-t border-border bg-background px-4 pb-safe pt-4">
                    <div className="mb-3">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Inzet
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={wager}
                                onChange={(e) => setWager(e.target.value)}
                                placeholder="0"
                                min={1}
                                max={points}
                                disabled={isSpinning || points === 0}
                                className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-center text-lg font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setWager(Math.floor(points / 2).toString())}
                                disabled={isSpinning || points === 0}
                                className="shrink-0"
                            >
                                50%
                            </Button>
                            <Button
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
                        onClick={handleSpin}
                        disabled={!canSpin}
                        className="w-full"
                        size="lg"
                    >
                        {isSpinning ? 'Draait...' : 'Draai het rad'}
                    </Button>

                    {points === 0 && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
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
