import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

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

export default function LosePage({ winner, player, game }: Props) {
    const snowflakes = useMemo(
        () =>
            Array.from({ length: 12 }).map((_, i) => ({
                left: `${seededRandom(i * 100 + 1) * 100}%`,
                top: `${seededRandom(i * 100 + 2) * 100}%`,
                fontSize: `${16 + seededRandom(i * 100 + 3) * 20}px`,
                animationDelay: `${seededRandom(i * 100 + 4) * 2}s`,
            })),
        []
    );

    return (
        <>
            <Head title="Einde Spel" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-6 py-12">
                {/* Snowflake decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
                    {snowflakes.map((style, i) => (
                        <div
                            key={i}
                            className="absolute text-muted-foreground/30 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000"
                            style={style}
                        >
                            ❄
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Heading - softer, encouraging */}
                    <h1 data-testid="lose-title" className="text-3xl font-bold text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
                        Goed gespeeld!
                    </h1>

                    <p className="mt-2 text-lg text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-100">
                        Je eindigde op plek <span className="font-semibold text-foreground">{player.rank}</span> van {game.total_players} spelers
                    </p>

                    {/* Secret word reveal with winner inline */}
                    <div data-testid="secret-word-reveal" className="mt-8 rounded-xl border border-border bg-card px-6 py-5 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in motion-safe:duration-700 motion-safe:delay-200">
                        <p className="text-sm text-muted-foreground">Het mystery woord was</p>
                        <p className="mt-1 text-2xl font-bold uppercase tracking-widest text-foreground">
                            {game.secret_word}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Geraden door <span data-testid="winner-name" className="font-medium text-foreground">{winner.name}</span>
                        </p>
                    </div>

                    {/* Player stats with context */}
                    <div className="mt-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-300">
                        <p className="text-muted-foreground">Jouw eindscore</p>
                        <p className="text-3xl font-bold text-foreground tabular-nums">{player.points}</p>
                        <p className="text-sm text-muted-foreground">punten</p>
                    </div>

                    {/* CTA */}
                    <div className="mt-10 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-400">
                        <Button asChild size="lg">
                            <Link href="/">Terug naar start</Link>
                        </Button>
                    </div>

                    {/* Encouragement */}
                    <p className="mt-6 text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-500">
                        Bedankt voor het meespelen!
                    </p>
                </div>
            </div>
        </>
    );
}
