import { PlayHeader } from '@/components/play-header';
import { getInitials } from '@/hooks/use-initials';
import PlayLayout from '@/layouts/play-layout';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';

interface PlayerData {
    id: number;
    name: string;
    avatar_url: string | null;
    points: number;
    rank: number;
    questions_count: number;
    wordles_completed: number;
    avg_wordle_guesses: number | null;
    is_current: boolean;
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
    players?: PlayerData[];
    error?: string;
}

export default function PlayersPage({ player, players = [], error }: Props) {
    if (error === 'no_active_game') {
        return (
            <PlayLayout>
                <Head title="Spelers" />
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-2xl font-bold text-foreground">
                        Geen actief spel
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Wacht tot de beheerder een spel start.
                    </p>
                </div>
            </PlayLayout>
        );
    }

    const podium = players.filter((p) => p.rank <= 3);
    const others = players.filter((p) => p.rank > 3);

    return (
        <PlayLayout>
            <Head title="Spelers" />
            <div className="flex h-full flex-col">
                <PlayHeader title="Ranglijst" points={player?.points ?? 0} />

                {/* Players List */}
                <div
                    data-testid="leaderboard"
                    className="flex-1 overflow-y-auto px-4 py-4"
                >
                    {/* Podium Section */}
                    {podium.length > 0 && (
                        <div className="mb-6 space-y-2">
                            {podium.map((p) => (
                                <PodiumCard key={p.id} player={p} />
                            ))}
                        </div>
                    )}

                    {/* Separator */}
                    {podium.length > 0 && others.length > 0 && (
                        <div className="mb-4 border-t border-border" />
                    )}

                    {/* Others */}
                    {others.length > 0 && (
                        <div className="divide-y divide-border">
                            {others.map((p) => (
                                <PlayerRow key={p.id} player={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PlayLayout>
    );
}

function PodiumCard({ player }: { player: PlayerData }) {
    const initials = getInitials(player.name);
    const medals = ['🥇', '🥈', '🥉'];
    const medal = medals[player.rank - 1];

    return (
        <div
            data-testid={`player-row-${player.id}`}
            className={cn(
                'relative flex items-center gap-4 rounded-xl px-4 py-3',
                player.rank === 1 && 'bg-amber-50 dark:bg-amber-900/20',
                player.rank === 2 && 'bg-zinc-50 dark:bg-zinc-800/30',
                player.rank === 3 && 'bg-orange-50 dark:bg-orange-900/20',
                player.is_current && 'ring-2 ring-primary ring-offset-2',
            )}
        >
            {/* Medal */}
            <span className="text-2xl">{medal}</span>

            {/* Avatar */}
            {player.avatar_url ? (
                <img
                    src={player.avatar_url}
                    alt={player.name}
                    className="size-11 shrink-0 rounded-full border-2 border-background object-cover shadow-sm"
                />
            ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary-light text-sm font-semibold text-primary shadow-sm">
                    {initials}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground">
                    {player.name}
                    {player.is_current && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (jij)
                        </span>
                    )}
                </span>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted/70 px-1.5 py-0.5">
                        {player.questions_count} vragen
                    </span>
                    {player.avg_wordle_guesses !== null && (
                        <span className="rounded bg-muted/70 px-1.5 py-0.5">
                            ∅ {player.avg_wordle_guesses}
                        </span>
                    )}
                </div>
            </div>

            {/* Points */}
            <div className="shrink-0 text-right">
                <span className="font-display text-xl font-bold text-foreground">
                    {player.points}
                </span>
                <p className="text-xs text-muted-foreground">pts</p>
            </div>
        </div>
    );
}

function PlayerRow({ player }: { player: PlayerData }) {
    const initials = getInitials(player.name);

    return (
        <div
            data-testid={`player-row-${player.id}`}
            className={cn(
                'relative flex items-center gap-3 py-3',
                player.is_current && 'bg-primary/5',
            )}
        >
            {/* Current player indicator */}
            {player.is_current && (
                <span className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
            )}

            {/* Rank */}
            <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
                {player.rank}
            </span>

            {/* Avatar */}
            {player.avatar_url ? (
                <img
                    src={player.avatar_url}
                    alt={player.name}
                    className="size-9 shrink-0 rounded-full object-cover"
                />
            ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                    {initials}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                    {player.name}
                    {player.is_current && (
                        <span className="ml-1 text-xs text-muted-foreground">
                            (jij)
                        </span>
                    )}
                </span>
            </div>

            {/* Points */}
            <span className="shrink-0 font-semibold text-foreground">
                {player.points}
            </span>
        </div>
    );
}
