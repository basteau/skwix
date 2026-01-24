import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameData {
    id: number;
    secret_word: string;
    status: 'pending' | 'active' | 'completed';
    player_count: number;
    starts_at: string | null;
    created_at: string;
}

interface Props {
    games: GameData[];
}

export default function AdminDashboard({ games = [] }: Props) {
    return (
        <>
            <Head title="Admin - Skwix" />
            <div className="min-h-svh bg-background">
                <header className="border-b border-border bg-card px-6 py-4 pt-safe">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                            <p className="text-sm text-muted-foreground">Beheer Skwix spellen</p>
                        </div>
                        <Link href="/admin/create">
                            <Button>Nieuw Spel</Button>
                        </Link>
                    </div>
                </header>

                <main className="p-6 pb-safe">
                    {games.length === 0 ? (
                        <div className="mx-auto max-w-md py-12">
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="flex gap-1">
                                        {['S', 'T', 'A', 'R', 'T'].map((letter, i) => (
                                            <div
                                                key={i}
                                                className="flex size-10 items-center justify-center rounded bg-primary/10 font-mono text-lg font-bold text-primary"
                                            >
                                                {letter}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-center font-display text-xl font-bold text-foreground">
                                Begin je eerste spel
                            </h2>
                            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                                Kies een geheim woord, nodig spelers uit, en plan wanneer het spel begint.
                                Spelers raden het woord via Wordle-puzzels en ja/nee vragen.
                            </p>
                            <div className="mt-6 space-y-2 text-sm">
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
                                    <span className="text-foreground">Kies een 5-letter woord</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
                                    <span className="text-foreground">Stel spelers + starttijd in</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
                                    <span className="text-foreground">Deel de uitnodigingscodes</span>
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <Link href="/admin/create">
                                    <Button size="lg">Maak je eerste spel</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {games.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

function GameCard({ game }: { game: GameData }) {
    const statusColors: Record<string, string> = {
        pending: 'bg-warning/15 text-[oklch(45%_0.15_85)]',
        active: 'bg-success/15 text-[oklch(40%_0.15_145)]',
        completed: 'bg-muted text-muted-foreground',
    };

    const statusLabels: Record<string, string> = {
        pending: 'Wachtend',
        active: 'Actief',
        completed: 'Voltooid',
    };

    const startsAt = game.starts_at ? new Date(game.starts_at) : null;

    return (
        <Link
            href={`/admin/game/${game.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-card/80"
        >
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-semibold uppercase tracking-wider text-foreground">
                            {game.secret_word}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                statusColors[game.status]
                            )}
                        >
                            {statusLabels[game.status]}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{game.player_count} spelers</span>
                        {startsAt && (
                            <span>
                                Start:{' '}
                                {startsAt.toLocaleDateString('nl-BE', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
