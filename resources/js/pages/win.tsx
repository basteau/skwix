import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

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

    const initials = winner.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title="Gewonnen!" />
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background px-6 py-12">
                {/* Confetti */}
                {showConfetti && <Confetti />}

                {/* Snowflake decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-primary/20 animate-in fade-in duration-1000"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                fontSize: `${16 + Math.random() * 24}px`,
                                animationDelay: `${Math.random() * 2}s`,
                            }}
                        >
                            ❄
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Winner Avatar */}
                    {winner.avatar_url ? (
                        <img
                            src={winner.avatar_url}
                            alt={winner.name}
                            className="size-32 rounded-full border-4 border-primary object-cover shadow-lg animate-in zoom-in duration-500"
                        />
                    ) : (
                        <div className="flex size-32 items-center justify-center rounded-full border-4 border-primary bg-primary-light text-4xl font-bold text-primary shadow-lg animate-in zoom-in duration-500">
                            {initials}
                        </div>
                    )}

                    {/* Heading */}
                    <h1 className="mt-6 text-4xl font-bold text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">
                        GEFELICITEERD!
                    </h1>

                    <p className="mt-2 text-xl font-semibold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {winner.name}
                    </p>

                    <p className="mt-1 text-muted-foreground animate-in fade-in duration-700 delay-200">
                        heeft het mystery woord geraden
                    </p>

                    {/* Secret word reveal */}
                    <div className="mt-4 rounded-lg bg-primary/10 px-6 py-3 animate-in fade-in zoom-in duration-700 delay-300">
                        <p className="text-sm text-muted-foreground">Het woord was</p>
                        <p className="text-2xl font-bold uppercase tracking-widest text-primary">
                            {game.secret_word}
                        </p>
                    </div>

                    {/* Points */}
                    <p className="mt-4 text-lg text-foreground animate-in fade-in duration-700 delay-400">
                        Eindscore: <span className="font-bold text-primary">{winner.points}</span> punten
                    </p>

                    {/* QR Code Prize */}
                    <div className="mt-8 rounded-xl bg-white p-4 shadow-lg animate-in fade-in zoom-in duration-700 delay-500">
                        <QRCode value={prizeUrl} size={160} />
                    </div>

                    <p className="mt-4 text-sm font-medium text-muted-foreground animate-in fade-in duration-700 delay-600">
                        Scan voor je prijs 🎁
                    </p>
                </div>
            </div>
        </>
    );
}

function Confetti() {
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#f59e0b', '#10b981'];
    const pieces = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
    }));

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute animate-confetti"
                    style={{
                        left: `${piece.x}%`,
                        top: '-20px',
                        width: `${piece.size}px`,
                        height: `${piece.size}px`,
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '0',
                        transform: `rotate(${piece.rotation}deg)`,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}
