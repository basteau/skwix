import { getAvatarUrl } from '@/components/avatar-picker';
import { NoActiveGame } from '@/components/no-active-game';
import { PlayHeader } from '@/components/play-header';
import { getInitials } from '@/hooks/use-initials';
import PlayLayout from '@/layouts/play-layout';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

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
    testMode?: { active: boolean };
}

const POLL_INTERVAL = 10_000; // 10 seconds

export default function PlayersPage({
    player,
    game,
    players = [],
    error,
    testMode,
}: Props) {
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll for leaderboard updates
    useEffect(() => {
        if (testMode?.active || error || game?.status === 'completed') return;

        pollRef.current = setInterval(() => {
            router.reload({ only: ['players', 'game'] });
        }, POLL_INTERVAL);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [testMode?.active, error, game?.status]);

    // Redirect when game completes
    useEffect(() => {
        if (game?.status === 'completed') {
            router.visit('/game/end');
        }
    }, [game?.status]);

    if (error === 'no_active_game') {
        return <NoActiveGame title="Spelers" />;
    }

    return (
        <PlayLayout>
            <Head title="Spelers" />
            <div className="flex h-full flex-col pt-[calc(var(--header-height)+var(--safe-top)+0.5rem)]">
                <PlayHeader
                    title="Ranglijst"
                    points={player?.points ?? 0}
                    testMode={testMode?.active}
                />

                {/* Players List */}
                <div
                    data-testid="leaderboard"
                    className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
                >
                    {players.map((p) => (
                        <PlayerCard key={p.id} player={p} />
                    ))}
                </div>
            </div>
        </PlayLayout>
    );
}

function PlayerCard({ player }: { player: PlayerData }) {
    const initials = getInitials(player.name);
    const medals = ['🥇', '🥈', '🥉'];
    const medal = player.rank <= 3 ? medals[player.rank - 1] : null;

    const isPodium = player.rank <= 3;
    const avatarSize = isPodium ? 'size-11' : 'size-9';
    const textSize = isPodium ? 'text-xl' : 'text-base';

    return (
        <div
            data-testid={`player-row-${player.id}`}
            className={cn(
                'relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
                player.rank === 1 && 'bg-amber-50 dark:bg-amber-900/20',
                player.rank === 2 && 'bg-zinc-50 dark:bg-zinc-800/30',
                player.rank === 3 && 'bg-orange-50 dark:bg-orange-900/20',
                player.rank > 3 && 'bg-card',
                player.is_current &&
                    'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
        >
            {/* Rank indicator or medal */}
            {medal ? (
                <span className="w-8 shrink-0 text-center text-2xl">
                    {medal}
                </span>
            ) : (
                <span className="w-8 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                    {player.rank}
                </span>
            )}

            {/* Avatar */}
            {getAvatarUrl(player.avatar_url) ? (
                <img
                    src={getAvatarUrl(player.avatar_url)}
                    alt={player.name}
                    className={cn(
                        avatarSize,
                        'shrink-0 rounded-full border-2 border-background object-cover shadow-sm',
                    )}
                />
            ) : (
                <div
                    className={cn(
                        avatarSize,
                        'flex shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary-light font-semibold text-primary shadow-sm',
                        isPodium ? 'text-sm' : 'text-xs',
                    )}
                >
                    {initials}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground">
                    {player.name}
                    {player.is_current && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            jij
                        </span>
                    )}
                </span>
                {isPodium && (
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
                )}
            </div>

            {/* Points */}
            <div className="shrink-0 text-right">
                <span
                    className={cn(
                        'font-display font-bold text-foreground',
                        textSize,
                    )}
                >
                    {player.points}
                </span>
                {isPodium && (
                    <p className="text-xs text-muted-foreground">pts</p>
                )}
            </div>
        </div>
    );
}
