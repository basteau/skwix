import { Head } from '@inertiajs/react';
import { getInitials } from '@/hooks/use-initials';
import PlayLayout from '@/layouts/play-layout';
import { cn } from '@/lib/utils';

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

export default function PlayersPage({ player, game, players = [], error }: Props) {
    if (error === 'no_active_game') {
        return (
            <PlayLayout>
                <Head title="Spelers" />
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-2xl font-bold text-foreground">Geen actief spel</h1>
                    <p className="mt-2 text-muted-foreground">
                        Wacht tot de beheerder een spel start.
                    </p>
                </div>
            </PlayLayout>
        );
    }

    return (
        <PlayLayout>
            <Head title="Spelers" />
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Ranglijst</span>
                    <span className="font-semibold text-foreground">{player?.points ?? 0} punten</span>
                </header>

                {/* Players List */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="space-y-3">
                        {players.map((p) => (
                            <PlayerCard key={p.id} player={p} />
                        ))}
                    </div>
                </div>
            </div>
        </PlayLayout>
    );
}

function PlayerCard({ player }: { player: PlayerData }) {
    const initials = getInitials(player.name);

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-card p-3',
                player.is_current && 'border-primary bg-primary/5'
            )}
        >
            {/* Rank Badge */}
            <RankBadge rank={player.rank} />

            {/* Avatar */}
            {player.avatar_url ? (
                <img
                    src={player.avatar_url}
                    alt={player.name}
                    className="size-12 shrink-0 rounded-full border-2 border-border object-cover"
                />
            ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary-light text-sm font-semibold text-primary">
                    {initials}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                        {player.name}
                        {player.is_current && (
                            <span className="ml-1 text-xs text-muted-foreground">(jij)</span>
                        )}
                    </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{player.questions_count} vragen</span>
                    {player.avg_wordle_guesses !== null && (
                        <span>∅ {player.avg_wordle_guesses} wordle</span>
                    )}
                </div>
            </div>

            {/* Points */}
            <div className="shrink-0 text-right">
                <span className="text-lg font-bold text-foreground">{player.points}</span>
                <p className="text-xs text-muted-foreground">punten</p>
            </div>
        </div>
    );
}

function RankBadge({ rank }: { rank: number }) {
    const colors: Record<number, string> = {
        1: 'bg-amber-400 text-amber-950',
        2: 'bg-gray-300 text-gray-800',
        3: 'bg-amber-600 text-amber-50',
    };

    const bgColor = colors[rank] ?? 'bg-muted text-muted-foreground';

    return (
        <div
            className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                bgColor
            )}
        >
            {rank}
        </div>
    );
}
