import { PlayHeader } from '@/components/play-header';
import { TestModeBanner } from '@/components/test-mode-banner';
import { Button } from '@/components/ui/button';
import PlayLayout from '@/layouts/play-layout';
import { cn, getCsrfToken } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { Snowflake } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const CONFETTI_DATA = Array.from({ length: 30 }).map((_, i) => ({
    left: (i * 3.5 + ((i * 11) % 7)) % 100,
    delay: (i * 40) % 600,
    duration: 2.5 + (i % 4) * 0.4,
    colorIdx: i % 5,
    size: 6 + (i % 4) * 2,
    rotation: (i * 45) % 360,
}));

const SNOWFLAKES = Array.from({ length: 12 }).map((_, i) => ({
    left: (i * 8 + ((i * 13) % 10)) % 100,
    delay: (i * 800) % 4000,
    duration: 8 + (i % 5) * 2,
    size: 8 + (i % 3) * 4,
    opacity: 0.15 + (i % 4) * 0.05,
}));

interface SpinRecord {
    id: number;
    amount: number;
    won: boolean;
    points_change: number;
    created_at: string;
}

interface Props {
    testMode?: {
        active: boolean;
    };
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
const LIGHTS_COUNT = 32;

const WAGER_PRESETS = [10, 25, 50, 100];

export default function FortunePage({
    testMode,
    player,
    recentSpins: initialSpins = [],
    error,
}: Props) {
    const [points, setPoints] = useState(player?.points ?? 0);
    const [wager, setWager] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<{
        won: boolean;
        change: number;
    } | null>(null);
    const [, setRecentSpins] = useState<SpinRecord[]>(initialSpins);
    const [showCelebration, setShowCelebration] = useState(false);
    const [lightPhase, setLightPhase] = useState(0);
    const [showFrostOverlay, setShowFrostOverlay] = useState(false);

    const canSpin = points > 0 && wager >= 1 && wager <= points && !isSpinning;

    useEffect(() => {
        if (!isSpinning) return;
        const interval = setInterval(() => {
            setLightPhase((p) => (p + 1) % LIGHTS_COUNT);
        }, 50);
        return () => clearInterval(interval);
    }, [isSpinning]);

    const handleSpin = useCallback(async () => {
        if (!canSpin) return;

        setIsSpinning(true);
        setResult(null);
        setShowCelebration(false);
        setShowFrostOverlay(false);

        try {
            const response = await fetch('/play/fortune/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ wager }),
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
                setWager(0);
                setIsSpinning(false);
                
                if (data.won) {
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 3000);
                } else {
                    setShowFrostOverlay(true);
                    setTimeout(() => setShowFrostOverlay(false), 2000);
                }
            }, 4000);
        } catch {
            setIsSpinning(false);
        }
    }, [canSpin, wager]);

    const adjustWager = (amount: number) => {
        setWager((prev) => Math.max(0, Math.min(points, prev + amount)));
    };

    const setPresetWager = (preset: number) => {
        setWager(Math.min(preset, points));
    };

    if (error === 'no_active_game') {
        return (
            <PlayLayout>
                <Head title="Rad" />
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

    return (
        <PlayLayout>
            <Head title="Rad" />
            <div className="relative flex h-full flex-col overflow-hidden">
                {/* Test Mode Banner */}
                {testMode?.active && <TestModeBanner />}

                <PlayHeader
                    title="Rad van Fortuin"
                    points={points}
                    testId="fortune-points-display"
                />

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
                                className="text-primary/30"
                                style={{ width: flake.size, height: flake.size }}
                            />
                        </div>
                    ))}
                </div>

                {/* Frost overlay on loss */}
                {showFrostOverlay && (
                    <div className="pointer-events-none absolute inset-0 z-30 animate-frost-in bg-gradient-to-b from-primary/10 via-transparent to-primary/5" />
                )}

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

                {/* Wheel Area */}
                <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-4">
                    {/* Wheel Container */}
                    <div className="relative">
                        {/* Icicle pointer */}
                        <div
                            className={cn(
                                'absolute -top-4 left-1/2 z-20 -translate-x-1/2 transition-transform',
                                result && !isSpinning && 'animate-pointer-bounce',
                            )}
                        >
                            <svg width="28" height="40" viewBox="0 0 28 40" className="drop-shadow-lg">
                                <defs>
                                    <linearGradient id="icicle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="oklch(95% 0.02 220)" />
                                        <stop offset="30%" stopColor="oklch(85% 0.06 220)" />
                                        <stop offset="70%" stopColor="oklch(70% 0.1 230)" />
                                        <stop offset="100%" stopColor="oklch(55% 0.12 235)" />
                                    </linearGradient>
                                    <filter id="icicle-glow">
                                        <feGaussianBlur stdDeviation="1" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <path
                                    d="M14 0 L24 8 C26 10, 26 14, 24 18 L16 36 C15 39, 13 39, 12 36 L4 18 C2 14, 2 10, 4 8 Z"
                                    fill="url(#icicle-gradient)"
                                    filter="url(#icicle-glow)"
                                />
                                <path
                                    d="M10 6 L14 4 L16 8"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    opacity="0.6"
                                />
                            </svg>
                        </div>

                        {/* Outer ring with animated lights */}
                        <div className="absolute inset-0 -m-5">
                            <div className="relative size-full">
                                {Array.from({ length: LIGHTS_COUNT }).map((_, i) => {
                                    const angle = (i * 360) / LIGHTS_COUNT;
                                    const rad = (angle * Math.PI) / 180;
                                    const x = 50 + 49 * Math.cos(rad);
                                    const y = 50 + 49 * Math.sin(rad);
                                    
                                    const isActive = isSpinning
                                        ? (i - lightPhase + LIGHTS_COUNT) % LIGHTS_COUNT < 4
                                        : i % 2 === 0;
                                    
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                'absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-100',
                                                isActive
                                                    ? 'bg-primary shadow-[0_0_8px_var(--primary)]'
                                                    : 'bg-primary/30',
                                            )}
                                            style={{
                                                left: `${x}%`,
                                                top: `${y}%`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Metallic outer ring */}
                        <div
                            className="absolute inset-0 -m-2 rounded-full"
                            style={{
                                background: 'linear-gradient(135deg, oklch(80% 0.02 230), oklch(60% 0.03 235), oklch(75% 0.02 225))',
                                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)',
                            }}
                        />

                        {/* Main wheel */}
                        <div
                            data-testid="fortune-wheel"
                            className={cn(
                                'relative size-[280px] rounded-full transition-transform',
                                isSpinning && 'wheel-spinning',
                            )}
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transitionDuration: isSpinning ? '4s' : '0s',
                                transitionTimingFunction: 'cubic-bezier(0.15, 0.85, 0.15, 1)',
                                boxShadow: `
                                    0 0 40px oklch(45% 0.15 230 / 0.3),
                                    inset 0 4px 8px rgba(255,255,255,0.15),
                                    inset 0 -4px 8px rgba(0,0,0,0.1)
                                `,
                            }}
                        >
                            <svg viewBox="0 0 100 100" className="size-full">
                                <defs>
                                    {/* Win segment gradient - icy blue */}
                                    <linearGradient id="win-segment" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="oklch(55% 0.15 220)" />
                                        <stop offset="50%" stopColor="oklch(45% 0.18 230)" />
                                        <stop offset="100%" stopColor="oklch(38% 0.15 240)" />
                                    </linearGradient>
                                    
                                    {/* Lose segment gradient - frosted silver */}
                                    <linearGradient id="lose-segment" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="oklch(70% 0.02 230)" />
                                        <stop offset="50%" stopColor="oklch(60% 0.03 235)" />
                                        <stop offset="100%" stopColor="oklch(50% 0.02 240)" />
                                    </linearGradient>
                                    
                                    {/* Sheen overlay */}
                                    <radialGradient id="wheel-sheen" cx="25%" cy="25%" r="60%">
                                        <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                                        <stop offset="50%" stopColor="white" stopOpacity="0.05" />
                                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                                    </radialGradient>
                                    
                                    {/* Frost texture pattern */}
                                    <pattern id="frost-pattern" patternUnits="userSpaceOnUse" width="4" height="4">
                                        <circle cx="1" cy="1" r="0.5" fill="white" fillOpacity="0.1" />
                                        <circle cx="3" cy="3" r="0.3" fill="white" fillOpacity="0.08" />
                                    </pattern>
                                    
                                    {/* Center hub gradient */}
                                    <radialGradient id="hub-gradient" cx="30%" cy="30%" r="70%">
                                        <stop offset="0%" stopColor="oklch(90% 0.04 220)" />
                                        <stop offset="50%" stopColor="oklch(75% 0.08 225)" />
                                        <stop offset="100%" stopColor="oklch(55% 0.1 230)" />
                                    </radialGradient>
                                </defs>

                                {/* Segments */}
                                {Array.from({ length: SEGMENTS }).map((_, i) => {
                                    const isWin = i % 2 === 0;
                                    const startAngle = i * SEGMENT_ANGLE - 90;
                                    const endAngle = startAngle + SEGMENT_ANGLE;
                                    const path = describeArc(50, 50, 48, startAngle, endAngle);

                                    return (
                                        <g key={i}>
                                            <path
                                                d={path}
                                                fill={isWin ? 'url(#win-segment)' : 'url(#lose-segment)'}
                                                stroke="oklch(85% 0.03 220)"
                                                strokeWidth="0.8"
                                            />
                                            <path
                                                d={path}
                                                fill="url(#frost-pattern)"
                                            />
                                        </g>
                                    );
                                })}

                                {/* Sheen overlay */}
                                <circle cx="50" cy="50" r="48" fill="url(#wheel-sheen)" />

                                {/* Segment labels */}
                                {Array.from({ length: SEGMENTS }).map((_, i) => {
                                    const isWin = i % 2 === 0;
                                    const angle = (i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90) * (Math.PI / 180);
                                    const x = 50 + 32 * Math.cos(angle);
                                    const y = 50 + 32 * Math.sin(angle);
                                    const textRotation = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

                                    return (
                                        <text
                                            key={`text-${i}`}
                                            x={x}
                                            y={y}
                                            fill="white"
                                            fontSize="8"
                                            fontWeight="bold"
                                            fontFamily="var(--font-display)"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform={`rotate(${textRotation}, ${x}, ${y})`}
                                            style={{
                                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                            }}
                                        >
                                            {isWin ? '2×' : '❄'}
                                        </text>
                                    );
                                })}

                                {/* Divider pins */}
                                {Array.from({ length: SEGMENTS }).map((_, i) => {
                                    const angle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
                                    const x = 50 + 46 * Math.cos(angle);
                                    const y = 50 + 46 * Math.sin(angle);

                                    return (
                                        <circle
                                            key={`pin-${i}`}
                                            cx={x}
                                            cy={y}
                                            r="2"
                                            fill="oklch(85% 0.02 230)"
                                            stroke="oklch(70% 0.03 235)"
                                            strokeWidth="0.5"
                                        />
                                    );
                                })}

                                {/* Center hub */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="12"
                                    fill="url(#hub-gradient)"
                                    stroke="oklch(65% 0.08 225)"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="7"
                                    fill="oklch(50% 0.12 230)"
                                />
                                {/* Glass reflection */}
                                <ellipse
                                    cx="47"
                                    cy="47"
                                    rx="3"
                                    ry="2"
                                    fill="white"
                                    fillOpacity="0.4"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Result display */}
                    {result && (
                        <div
                            data-testid="fortune-result"
                            className={cn(
                                'mt-8 text-center',
                                'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in motion-safe:duration-500',
                            )}
                        >
                            <div
                                className={cn(
                                    'relative inline-block rounded-xl px-8 py-4',
                                    result.won
                                        ? 'bg-gradient-to-br from-success/20 to-success/5'
                                        : 'bg-gradient-to-br from-primary/10 to-primary/5',
                                )}
                            >
                                <p
                                    className={cn(
                                        'font-display text-5xl font-bold tracking-tight',
                                        result.won ? 'text-success' : 'text-muted-foreground',
                                    )}
                                >
                                    {result.won ? `+${result.change}` : result.change}
                                </p>
                                <p
                                    className={cn(
                                        'mt-1 text-sm font-medium',
                                        result.won ? 'text-success' : 'text-muted-foreground',
                                    )}
                                >
                                    {result.won ? 'Jackpot!' : 'Ingevroren...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Wager preview on wheel */}
                    {wager > 0 && !isSpinning && !result && (
                        <div className="mt-4 text-center animate-in fade-in duration-200">
                            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                                Inzet: {wager} → Win: {wager * 2}
                            </span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="border-t border-border bg-gradient-to-b from-card to-background px-4 pt-5 pb-[calc(var(--safe-bottom)+1.25rem)]">
                    {/* Wager chips */}
                    <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Inzet</span>
                            <span className="text-sm text-muted-foreground">
                                Beschikbaar: {points}
                            </span>
                        </div>
                        
                        {/* Preset chips */}
                        <div className="mb-3 flex gap-2">
                            {WAGER_PRESETS.filter(p => p <= points).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setPresetWager(preset)}
                                    disabled={isSpinning || points === 0}
                                    className={cn(
                                        'flex-1 rounded-full py-2.5 text-sm font-semibold transition-all',
                                        'border-2 active:scale-95',
                                        wager === preset
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                    )}
                                >
                                    {preset}
                                </button>
                            ))}
                            <button
                                onClick={() => setWager(points)}
                                disabled={isSpinning || points === 0}
                                className={cn(
                                    'flex-1 rounded-full py-2.5 text-sm font-semibold transition-all',
                                    'border-2 active:scale-95',
                                    wager === points && points > 0
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                )}
                            >
                                Max
                            </button>
                        </div>

                        {/* Fine adjustment */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => adjustWager(-10)}
                                disabled={isSpinning || wager < 10}
                                className="flex size-11 items-center justify-center rounded-full border-2 border-border bg-card text-lg font-bold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-40"
                            >
                                −
                            </button>
                            <div className="flex-1 rounded-lg bg-muted/50 py-3 text-center">
                                <span
                                    data-testid="fortune-wager-display"
                                    className="font-display text-2xl font-bold text-foreground"
                                >
                                    {wager}
                                </span>
                            </div>
                            <button
                                onClick={() => adjustWager(10)}
                                disabled={isSpinning || wager >= points}
                                className="flex size-11 items-center justify-center rounded-full border-2 border-border bg-card text-lg font-bold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-40"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Spin button */}
                    <Button
                        data-testid="fortune-spin-button"
                        onClick={handleSpin}
                        disabled={!canSpin}
                        className={cn(
                            'w-full text-base font-semibold',
                            canSpin && 'shadow-lg shadow-primary/25',
                        )}
                        size="lg"
                    >
                        {isSpinning ? (
                            <span className="flex items-center gap-2">
                                <Snowflake className="size-4 animate-spin" />
                                Draait...
                            </span>
                        ) : (
                            'Draai het rad'
                        )}
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

function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
) {
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
