import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { getInitials } from '@/hooks/use-initials';

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

export default function WinPage({ winner, game, prizeUrl }: Props) {
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const initials = getInitials(winner.name);

    const snowflakes = useMemo(
        () =>
            Array.from({ length: 15 }).map((_, i) => ({
                left: `${seededRandom(i * 100 + 1) * 100}%`,
                top: `${seededRandom(i * 100 + 2) * 100}%`,
                fontSize: `${16 + seededRandom(i * 100 + 3) * 24}px`,
                animationDelay: `${seededRandom(i * 100 + 4) * 2}s`,
            })),
        []
    );

    return (
        <>
            <Head title="Gewonnen!" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background px-6 py-12">
                {/* Confetti */}
                {showConfetti && <Confetti />}

                {/* Snowflake decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {snowflakes.map((style, i) => (
                        <div
                            key={i}
                            className="absolute text-primary/20 animate-in fade-in duration-1000"
                            style={style}
                        >
                            ❄
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Celebration heading - primary visual hierarchy */}
                    <h1 className="text-5xl font-bold tracking-tight text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
                        🏆 GEWONNEN! 🏆
                    </h1>

                    {/* Winner Avatar with glow effect */}
                    <div className="mt-8">
                        {winner.avatar_url ? (
                            <img
                                src={winner.avatar_url}
                                alt={winner.name}
                                className="size-36 rounded-full border-[6px] border-primary object-cover animate-in zoom-in duration-500"
                                style={{
                                    boxShadow: '0 0 40px oklch(55% 0.15 230 / 0.5), 0 0 80px oklch(65% 0.18 85 / 0.3)',
                                }}
                            />
                        ) : (
                            <div
                                className="flex size-36 items-center justify-center rounded-full border-[6px] border-primary bg-primary/10 text-4xl font-bold text-primary animate-in zoom-in duration-500"
                                style={{
                                    boxShadow: '0 0 40px oklch(55% 0.15 230 / 0.5), 0 0 80px oklch(65% 0.18 85 / 0.3)',
                                }}
                            >
                                {initials}
                            </div>
                        )}
                    </div>

                    {/* Winner name - secondary hierarchy */}
                    <p className="mt-4 text-2xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {winner.name}
                    </p>

                    <p className="mt-1 text-base text-muted-foreground animate-in fade-in duration-700 delay-200">
                        heeft het mystery woord geraden
                    </p>

                    {/* Secret word reveal - tertiary hierarchy */}
                    <div className="mt-6 rounded-xl bg-primary/10 px-8 py-4 animate-in fade-in zoom-in duration-700 delay-300">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Het woord was</p>
                        <p className="mt-1 text-3xl font-bold uppercase tracking-[0.2em] text-primary">
                            {game.secret_word}
                        </p>
                    </div>

                    {/* Points - supporting info */}
                    <p className="mt-4 text-lg text-foreground animate-in fade-in duration-700 delay-400">
                        Eindscore: <span className="font-bold text-primary">{winner.points}</span> punten
                    </p>

                    {/* QR Code Prize with themed container */}
                    <div className="mt-8 animate-in fade-in zoom-in duration-700 delay-500">
                        <div
                            className="rounded-2xl border-2 border-primary/30 bg-white p-1"
                            style={{
                                boxShadow: '0 0 24px oklch(55% 0.15 230 / 0.2)',
                            }}
                        >
                            <div className="rounded-xl bg-gradient-to-b from-primary/5 to-transparent px-6 pt-3 pb-4">
                                <p className="mb-3 text-sm font-semibold text-primary">Claim je prijs</p>
                                <div className="rounded-lg bg-white p-3">
                                    <QRCode value={prizeUrl} size={140} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground animate-in fade-in duration-700 delay-600">
                        Scan de QR-code om je prijs op te halen
                    </p>
                </div>
            </div>
        </>
    );
}

const confettiPieces = (() => {
    // Theme-aligned OKLCH colors: gold, silver, ice blue variations
    const colors = [
        'oklch(80% 0.15 85)',   // Gold bright
        'oklch(70% 0.12 85)',   // Gold medium
        'oklch(85% 0.05 250)',  // Silver light
        'oklch(75% 0.03 250)',  // Silver medium
        'oklch(80% 0.12 230)',  // Ice blue light
        'oklch(65% 0.15 230)',  // Ice blue medium (primary)
        'oklch(90% 0.08 85)',   // Gold shimmer
        'oklch(95% 0.02 250)',  // Silver shimmer
    ];
    return Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: seededRandom(i * 10 + 1) * 100,
        color: colors[Math.floor(seededRandom(i * 10 + 2) * colors.length)],
        delay: seededRandom(i * 10 + 3) * 3,
        duration: 2 + seededRandom(i * 10 + 4) * 2,
        size: 8 + seededRandom(i * 10 + 5) * 8,
        rotation: seededRandom(i * 10 + 6) * 360,
        isCircle: seededRandom(i * 10 + 7) > 0.5,
    }));
})();

function Confetti() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {confettiPieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute animate-confetti"
                    style={{
                        left: `${piece.x}%`,
                        top: '-20px',
                        width: `${piece.size}px`,
                        height: `${piece.size}px`,
                        backgroundColor: piece.color,
                        borderRadius: piece.isCircle ? '50%' : '0',
                        transform: `rotate(${piece.rotation}deg)`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}
