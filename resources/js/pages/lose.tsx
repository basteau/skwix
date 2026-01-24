import { Head } from '@inertiajs/react';
import { getInitials } from '@/hooks/use-initials';

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
    };
    game: {
        id: number;
        secret_word: string;
    };
}

export default function LosePage({ winner, player, game }: Props) {
    const winnerInitials = getInitials(winner.name);

    return (
        <>
            <Head title="Einde Spel" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-6 py-12">
                {/* Snowflake decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-muted-foreground/30 animate-in fade-in duration-1000"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                fontSize: `${16 + Math.random() * 20}px`,
                                animationDelay: `${Math.random() * 2}s`,
                            }}
                        >
                            ❄
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Helaas!
                    </h1>

                    <p className="mt-2 text-lg text-muted-foreground animate-in fade-in duration-700 delay-100">
                        Beter volgende keer! 💪
                    </p>

                    {/* Winner Section */}
                    <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-in fade-in zoom-in duration-700 delay-200">
                        <p className="text-sm text-muted-foreground">De winnaar is</p>

                        <div className="mt-3 flex flex-col items-center">
                            {winner.avatar_url ? (
                                <img
                                    src={winner.avatar_url}
                                    alt={winner.name}
                                    className="size-20 rounded-full border-2 border-primary object-cover"
                                />
                            ) : (
                                <div className="flex size-20 items-center justify-center rounded-full border-2 border-primary bg-primary-light text-2xl font-bold text-primary">
                                    {winnerInitials}
                                </div>
                            )}

                            <p className="mt-2 text-xl font-semibold text-foreground">
                                {winner.name}
                            </p>
                        </div>
                    </div>

                    {/* Secret word reveal */}
                    <div className="mt-6 rounded-lg bg-muted/50 px-6 py-4 animate-in fade-in zoom-in duration-700 delay-300">
                        <p className="text-sm text-muted-foreground">Het mystery woord was</p>
                        <p className="mt-1 text-2xl font-bold uppercase tracking-widest text-foreground">
                            {game.secret_word}
                        </p>
                    </div>

                    {/* Player stats */}
                    <div className="mt-6 animate-in fade-in duration-700 delay-400">
                        <p className="text-muted-foreground">Jouw eindscore</p>
                        <p className="text-3xl font-bold text-foreground">{player.points}</p>
                        <p className="text-sm text-muted-foreground">punten</p>
                    </div>

                    {/* Encouragement */}
                    <div className="mt-8 max-w-xs text-center animate-in fade-in duration-700 delay-500">
                        <p className="text-sm text-muted-foreground">
                            Bedankt voor het meespelen! Tot de volgende ronde.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
