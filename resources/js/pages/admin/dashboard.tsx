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
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
                            <p className="text-lg font-medium text-foreground">Geen spellen</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Maak je eerste spel aan om te beginnen
                            </p>
                            <Link href="/admin/create" className="mt-4">
                                <Button>Maak Spel</Button>
                            </Link>
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
        pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
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
