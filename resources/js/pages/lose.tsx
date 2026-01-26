import { getPortraitUrl } from '@/components/avatar-picker';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { Snowflake } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    winner: {
        id: number;
        name: string;
        avatar_url: string | null;
    };
    player: {
        id: number;
        name: string;
        points: number;
        rank: number;
    };
    game: {
        id: number;
        secret_word: string;
        total_players: number;
    };
}

const SNOWFLAKES = Array.from({ length: 10 }).map((_, i) => ({
    left: (i * 11 + ((i * 7) % 12)) % 100,
    delay: (i * 700) % 4500,
    duration: 12 + (i % 4) * 3,
    size: 10 + (i % 3) * 5,
    opacity: 0.08 + (i % 4) * 0.03,
}));

export default function LosePage({ winner, player, game }: Props) {
    const [countedRank, setCountedRank] = useState(1);
    const [revealedLetters, setRevealedLetters] = useState(0);

    const winnerInitials = getInitials(winner.name);
    const winnerPortraitUrl = getPortraitUrl(winner.avatar_url);

    useEffect(() => {
        if (countedRank < player.rank) {
            const timer = setTimeout(() => {
                setCountedRank((prev) => Math.min(prev + 1, player.rank));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [countedRank, player.rank]);

    useEffect(() => {
        const word = game.secret_word;
        if (revealedLetters < word.length) {
            const timer = setTimeout(
                () => {
                    setRevealedLetters((prev) => prev + 1);
                },
                400 + revealedLetters * 100,
            );
            return () => clearTimeout(timer);
        }
    }, [revealedLetters, game.secret_word]);

    return (
        <>
            <Head title="Einde Spel" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
                {/* Subtle gradient overlay */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(to bottom, oklch(100% 0 0) 0%, oklch(97% 0.01 250) 50%, oklch(100% 0 0) 100%)',
                    }}
                />

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
                                className="text-muted-foreground"
                                style={{
                                    width: flake.size,
                                    height: flake.size,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
                    {/* Participation medal */}
                    <div className="relative mb-4 motion-safe:animate-in motion-safe:duration-700 motion-safe:zoom-in">
                        <svg viewBox="0 0 64 80" className="size-16">
                            <defs>
                                <linearGradient
                                    id="medal-gradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="oklch(75% 0.08 230)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="oklch(60% 0.10 235)"
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="ribbon-gradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="0%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="oklch(50% 0.12 230)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="oklch(40% 0.10 235)"
                                    />
                                </linearGradient>
                            </defs>
                            {/* Ribbon */}
                            <path
                                d="M22 0 L22 35 L32 28 L42 35 L42 0 Z"
                                fill="url(#ribbon-gradient)"
                            />
                            {/* Medal */}
                            <circle
                                cx="32"
                                cy="50"
                                r="22"
                                fill="url(#medal-gradient)"
                            />
                            <circle
                                cx="32"
                                cy="50"
                                r="17"
                                fill="oklch(85% 0.04 230)"
                                stroke="oklch(70% 0.06 230)"
                                strokeWidth="1"
                            />
                            {/* Star */}
                            <path
                                d="M32 40 L34 46 L40 46 L35 50 L37 56 L32 52 L27 56 L29 50 L24 46 L30 46 Z"
                                fill="oklch(55% 0.10 230)"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1
                        data-testid="lose-title"
                        className="font-display text-3xl font-bold text-foreground motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4"
                    >
                        Loser!
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in">
                        Meer geluk volgende keer
                    </p>

                    {/* Rank display */}
                    <div className="mt-5 motion-safe:animate-in motion-safe:delay-100 motion-safe:duration-700 motion-safe:fade-in">
                        <div className="inline-flex items-baseline gap-1.5">
                            <span className="text-sm text-muted-foreground">
                                Plek
                            </span>
                            <span className="font-display text-5xl font-bold text-foreground tabular-nums">
                                {countedRank}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                van {game.total_players}
                            </span>
                        </div>
                        {/* Mini podium */}
                        <div className="mt-3 flex items-end justify-center gap-1">
                            {[2, 1, 3].map((pos) => (
                                <div
                                    key={pos}
                                    className={cn(
                                        'flex w-8 items-center justify-center rounded-t text-xs font-bold transition-all',
                                        pos === 1 &&
                                            'h-8 bg-amber-400/80 text-white',
                                        pos === 2 &&
                                            'h-6 bg-muted text-muted-foreground',
                                        pos === 3 &&
                                            'h-5 bg-muted/70 text-muted-foreground',
                                        player.rank === pos &&
                                            'ring-2 ring-primary ring-offset-2',
                                    )}
                                >
                                    {pos}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Secret word reveal */}
                    <div
                        data-testid="secret-word-reveal"
                        className="mt-8 w-full rounded-xl border border-border bg-card/80 px-5 py-5 shadow-sm motion-safe:animate-in motion-safe:delay-200 motion-safe:duration-700 motion-safe:fade-in"
                    >
                        <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                            Het woord was
                        </p>
                        <div className="flex justify-center gap-1">
                            {game.secret_word.split('').map((letter, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex size-10 items-center justify-center rounded-md border font-display text-lg font-bold uppercase transition-all duration-300',
                                        i < revealedLetters
                                            ? 'scale-100 border-border bg-muted/50 text-foreground'
                                            : 'scale-90 border-transparent bg-transparent text-transparent',
                                    )}
                                >
                                    {letter}
                                </div>
                            ))}
                        </div>

                        {/* Winner credit with portrait */}
                        <div className="mt-5 flex flex-col items-center gap-3">
                            <p className="text-xs text-muted-foreground">
                                Geraden door
                            </p>
                            <div className="relative">
                                {winnerPortraitUrl ? (
                                    <img
                                        src={winnerPortraitUrl}
                                        alt={winner.name}
                                        data-testid="winner-portrait"
                                        className="size-24 rounded-xl border-2 border-amber-400/60 object-cover shadow-md"
                                    />
                                ) : winner.avatar_url ? (
                                    <img
                                        src={winner.avatar_url}
                                        alt={winner.name}
                                        className="size-16 rounded-full border-2 border-border object-cover"
                                    />
                                ) : (
                                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                                        {winnerInitials}
                                    </div>
                                )}
                                {/* Mini crown for winner */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                    <svg
                                        viewBox="0 0 16 12"
                                        className="size-5 text-amber-500"
                                    >
                                        <path
                                            d="M1 10 L3 4 L6 7 L8 2 L10 7 L13 4 L15 10 Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span
                                    data-testid="winner-name"
                                    className="font-medium text-foreground"
                                >
                                    {winner.name}
                                </span>
                                <svg
                                    viewBox="0 0 16 16"
                                    className="size-4 text-amber-500"
                                    fill="currentColor"
                                >
                                    <path d="M8 2L9.5 6H14L10.5 9L12 14L8 11L4 14L5.5 9L2 6H6.5L8 2Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Player stats */}
                    <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-muted/50 px-5 py-2.5 motion-safe:animate-in motion-safe:delay-300 motion-safe:duration-700 motion-safe:fade-in">
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">
                                Jouw score
                            </p>
                            <p className="font-display text-xl font-bold text-foreground tabular-nums">
                                {player.points}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                            <svg
                                viewBox="0 0 20 20"
                                className="size-5 text-primary"
                                fill="currentColor"
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fillOpacity="0.2"
                                />
                                <text
                                    x="10"
                                    y="14"
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="currentColor"
                                    fontWeight="bold"
                                >
                                    ★
                                </text>
                            </svg>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-10 w-full motion-safe:animate-in motion-safe:delay-400 motion-safe:duration-700 motion-safe:fade-in">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/">Terug naar start</Link>
                        </Button>
                    </div>


                </div>
            </div>
        </>
    );
}
