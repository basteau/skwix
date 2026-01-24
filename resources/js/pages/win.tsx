import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { Snowflake } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

interface Props {
    winner: {
        id: number;
        name: string;
        avatar_url: string | null;
        points: number;
    };
    game: {
        id: number;
        secret_word: string;
    };
    prizeUrl: string;
}

const CONFETTI_DATA = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    x: seededRandom(i * 10 + 1) * 100,
    delay: seededRandom(i * 10 + 3) * 2,
    duration: 2.5 + seededRandom(i * 10 + 4) * 1.5,
    size: 6 + seededRandom(i * 10 + 5) * 6,
    rotation: seededRandom(i * 10 + 6) * 360,
    colorIdx: Math.floor(seededRandom(i * 10 + 2) * 5),
}));

const SNOWFLAKES = Array.from({ length: 12 }).map((_, i) => ({
    left: (i * 9 + ((i * 13) % 10)) % 100,
    delay: (i * 600) % 4000,
    duration: 10 + (i % 4) * 3,
    size: 12 + (i % 3) * 6,
    opacity: 0.12 + (i % 4) * 0.04,
}));

export default function WinPage({ winner, game, prizeUrl }: Props) {
    const [showConfetti, setShowConfetti] = useState(true);
    const [revealedLetters, setRevealedLetters] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const word = game.secret_word;
        if (revealedLetters < word.length) {
            const timer = setTimeout(() => {
                setRevealedLetters((prev) => prev + 1);
            }, 600 + revealedLetters * 120);
            return () => clearTimeout(timer);
        }
    }, [revealedLetters, game.secret_word]);

    const initials = getInitials(winner.name);

    return (
        <>
            <Head title="Gewonnen!" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background px-4 py-10">
                {/* Confetti */}
                {showConfetti && <Confetti />}

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
                                className="text-primary"
                                style={{ width: flake.size, height: flake.size }}
                            />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
                    {/* Trophy */}
                    <div className="relative mb-2 motion-safe:animate-in motion-safe:duration-700 motion-safe:zoom-in">
                        <svg viewBox="0 0 80 80" className="size-20">
                            <defs>
                                <linearGradient id="trophy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="oklch(85% 0.15 85)" />
                                    <stop offset="50%" stopColor="oklch(75% 0.18 80)" />
                                    <stop offset="100%" stopColor="oklch(65% 0.15 75)" />
                                </linearGradient>
                                <linearGradient id="trophy-shine" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                                    <stop offset="50%" stopColor="white" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Cup */}
                            <path
                                d="M20 20 L20 40 Q20 55 40 60 Q60 55 60 40 L60 20 Z"
                                fill="url(#trophy-gradient)"
                            />
                            {/* Handles */}
                            <path
                                d="M20 25 Q8 25 8 35 Q8 45 18 45"
                                fill="none"
                                stroke="url(#trophy-gradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <path
                                d="M60 25 Q72 25 72 35 Q72 45 62 45"
                                fill="none"
                                stroke="url(#trophy-gradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            {/* Base */}
                            <path
                                d="M35 60 L35 68 L25 68 L25 72 L55 72 L55 68 L45 68 L45 60"
                                fill="url(#trophy-gradient)"
                            />
                            {/* Shine */}
                            <path
                                d="M25 22 L25 38 Q28 50 40 54 L40 22 Z"
                                fill="url(#trophy-shine)"
                            />
                            {/* Star */}
                            <path
                                d="M40 28 L42 34 L48 34 L43 38 L45 44 L40 40 L35 44 L37 38 L32 34 L38 34 Z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                        </svg>
                        {/* Sparkles */}
                        <div className="absolute -top-1 -right-1 text-amber-400 motion-safe:animate-pulse">✦</div>
                        <div className="absolute -bottom-0 -left-2 text-amber-300 motion-safe:animate-pulse" style={{ animationDelay: '0.3s' }}>✧</div>
                    </div>

                    {/* Title */}
                    <h1
                        data-testid="win-title"
                        className="font-display text-4xl font-bold tracking-tight text-foreground motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4"
                    >
                        Gewonnen!
                    </h1>

                    {/* Winner Avatar */}
                    <div className="relative mt-6 motion-safe:animate-in motion-safe:delay-100 motion-safe:duration-700 motion-safe:zoom-in">
                        {/* Glow ring */}
                        <div
                            className="absolute -inset-3 rounded-full motion-safe:animate-pulse"
                            style={{
                                background: 'radial-gradient(circle, oklch(75% 0.18 80 / 0.4) 0%, transparent 70%)',
                            }}
                        />
                        {winner.avatar_url ? (
                            <img
                                src={winner.avatar_url}
                                alt={winner.name}
                                className="relative size-28 rounded-full border-4 border-amber-400/80 object-cover shadow-xl"
                            />
                        ) : (
                            <div className="relative flex size-28 items-center justify-center rounded-full border-4 border-amber-400/80 bg-gradient-to-br from-primary/20 to-primary/10 font-display text-3xl font-bold text-primary shadow-xl">
                                {initials}
                            </div>
                        )}
                        {/* Crown */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <svg viewBox="0 0 32 24" className="size-8">
                                <path
                                    d="M2 20 L6 8 L12 14 L16 4 L20 14 L26 8 L30 20 Z"
                                    fill="oklch(80% 0.18 80)"
                                    stroke="oklch(70% 0.15 75)"
                                    strokeWidth="1"
                                />
                                <circle cx="6" cy="8" r="2" fill="oklch(85% 0.12 80)" />
                                <circle cx="16" cy="4" r="2.5" fill="oklch(90% 0.15 80)" />
                                <circle cx="26" cy="8" r="2" fill="oklch(85% 0.12 80)" />
                            </svg>
                        </div>
                    </div>

                    {/* Winner name */}
                    <p
                        data-testid="winner-name"
                        className="mt-4 font-display text-2xl font-bold text-foreground motion-safe:animate-in motion-safe:delay-200 motion-safe:duration-700 motion-safe:fade-in"
                    >
                        {winner.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground motion-safe:animate-in motion-safe:delay-200 motion-safe:duration-700 motion-safe:fade-in">
                        heeft het mystery woord geraden
                    </p>

                    {/* Secret word reveal */}
                    <div
                        data-testid="secret-word-reveal"
                        className="mt-6 w-full motion-safe:animate-in motion-safe:delay-300 motion-safe:duration-700 motion-safe:fade-in"
                    >
                        <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                            Het woord was
                        </p>
                        <div className="flex justify-center gap-1.5">
                            {game.secret_word.split('').map((letter, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'flex size-12 items-center justify-center rounded-lg border-2 font-display text-xl font-bold uppercase shadow-sm transition-all duration-300',
                                        i < revealedLetters
                                            ? 'scale-100 border-primary/30 bg-primary/10 text-primary'
                                            : 'scale-90 border-border bg-muted text-transparent',
                                    )}
                                >
                                    {letter}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Points badge */}
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400/20 via-amber-500/20 to-amber-400/20 px-5 py-2 motion-safe:animate-in motion-safe:delay-400 motion-safe:duration-700 motion-safe:fade-in">
                        <svg viewBox="0 0 20 20" className="size-5 text-amber-500" fill="currentColor">
                            <circle cx="10" cy="10" r="8" />
                            <text x="10" y="14" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">★</text>
                        </svg>
                        <span className="font-display text-lg font-bold text-foreground">
                            {winner.points} punten
                        </span>
                    </div>

                    {/* QR Code Prize */}
                    <div
                        data-testid="prize-qr-code"
                        className="mt-8 w-full motion-safe:animate-in motion-safe:delay-500 motion-safe:duration-700 motion-safe:fade-in motion-safe:zoom-in-95"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white p-1 shadow-lg">
                            {/* Ribbon header */}
                            <div className="flex items-center justify-center gap-2 rounded-t-xl bg-gradient-to-r from-primary via-primary to-primary/90 py-2.5">
                                <svg viewBox="0 0 20 20" className="size-4 text-primary-foreground" fill="currentColor">
                                    <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" />
                                </svg>
                                <span className="text-sm font-bold tracking-wide text-primary-foreground uppercase">
                                    Jouw Prijs
                                </span>
                                <svg viewBox="0 0 20 20" className="size-4 text-primary-foreground" fill="currentColor">
                                    <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" />
                                </svg>
                            </div>
                            {/* QR container */}
                            <div className="bg-white p-4">
                                <div className="mx-auto w-fit rounded-lg bg-white p-2">
                                    <QRCode value={prizeUrl} size={140} />
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Scan om je prijs te claimen
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function Confetti() {
    const colors = [
        'oklch(80% 0.15 85)',   // Gold
        'oklch(85% 0.05 250)',  // Silver
        'oklch(70% 0.12 230)',  // Ice blue
        'oklch(75% 0.10 80)',   // Warm gold
        'oklch(90% 0.08 220)',  // Light ice
    ];

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {CONFETTI_DATA.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute animate-confetti-burst"
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
}
