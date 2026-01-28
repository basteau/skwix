import { GameInfoButton } from '@/components/game-info-button';
import type {
    GameInfoContent} from '@/components/game-info-modal';
import {
    GameInfoModal,
} from '@/components/game-info-modal';
import { NoActiveGame } from '@/components/no-active-game';
import { PlayHeader } from '@/components/play-header';
import { PlayerAvatar } from '@/components/player-avatar';
import { RevealSabotageModal } from '@/components/reveal-sabotage-modal';
import { SabotageModal } from '@/components/sabotage-modal';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    NotificationItem,
    useNotifications,
} from '@/hooks/use-notifications';
import PlayLayout from '@/layouts/play-layout';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { Eye, Skull } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    can_sabotage?: boolean;
    has_pending_sabotage?: boolean;
}

interface SabotageInfo {
    cost: number;
    reveal_cost: number;
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
    sabotage?: SabotageInfo;
    error?: string;
    testMode?: { active: boolean };
    notifications?: NotificationItem[];
}

const POLL_INTERVAL = 10_000; // 10 seconds

const PLAYERS_INFO: GameInfoContent = {
    title: 'Spelers & Sabotage',
    description: 'Bekijk de ranglijst en saboteer je tegenstanders.',
    rules: [
        {
            icon: <Skull className="size-3 text-destructive" />,
            text: 'Sabotage (10 pts): draait het volgende ja/nee antwoord om',
        },
        {
            icon: <Eye className="size-3 text-amber-500" />,
            text: 'Onthullen (12 pts): check of je gesaboteerd bent',
        },
        { text: 'Je kunt dezelfde speler pas opnieuw saboteren na gebruik' },
    ],
    pointsInfo: 'Tip: saboteer de leider!',
};

export default function PlayersPage({
    player,
    game,
    players = [],
    sabotage,
    error,
    testMode,
    notifications = [],
}: Props) {
    // Notifications toast display
    useNotifications({
        notifications,
        enabled: !testMode?.active,
    });

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [sabotageTarget, setSabotageTarget] = useState<PlayerData | null>(
        null,
    );
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Use player points directly from props - no local state sync needed
    const currentPoints = player?.points ?? 0;

    // Poll for leaderboard updates (pause when hidden/offline)
    useEffect(() => {
        if (testMode?.active || error || game?.status === 'completed') return;

        const shouldPoll = () =>
            document.visibilityState === 'visible' && navigator.onLine;

        const poll = () => {
            if (shouldPoll()) {
                router.reload({
                    only: ['players', 'game', 'player', 'sabotage', 'notifications'],
                });
            }
        };

        pollRef.current = setInterval(poll, POLL_INTERVAL);

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

    const handleSabotageSuccess = useCallback(() => {
        router.reload({ only: ['players', 'player', 'sabotage'] });
    }, []);

    const handleRevealSuccess = useCallback(() => {
        // No more sessionStorage - server tracks revealed state
        router.reload({ only: ['player', 'sabotage'] });
    }, []);

    if (error === 'no_active_game') {
        return <NoActiveGame title="Spelers" />;
    }

    return (
        <PlayLayout>
            <Head title="Spelers" />
            <div className="flex h-full flex-col pt-[calc(var(--header-height)+var(--safe-top)+0.5rem)]">
                <PlayHeader
                    title="Ranglijst"
                    points={currentPoints}
                    testMode={testMode?.active}
                    rightAction={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRevealModal(true)}
                                className="h-9 gap-1.5 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-400"
                            >
                                <Eye className="size-4" />
                                <span className="hidden sm:inline">
                                    Onthullen
                                </span>
                            </Button>
                            <GameInfoButton
                                onClick={() => setShowInfoModal(true)}
                            />
                        </div>
                    }
                />

                {/* Players List */}
                <div
                    data-testid="leaderboard"
                    className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
                >
                    {players.map((p) => (
                        <PlayerCard
                            key={p.id}
                            player={p}
                            onSabotage={() => setSabotageTarget(p)}
                            sabotageEnabled={
                                game?.status === 'active' &&
                                currentPoints >= (sabotage?.cost ?? 8)
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Sabotage Modal */}
            <SabotageModal
                open={sabotageTarget !== null}
                onOpenChange={(open) => !open && setSabotageTarget(null)}
                target={sabotageTarget}
                cost={sabotage?.cost ?? 8}
                currentPoints={currentPoints}
                onSuccess={handleSabotageSuccess}
            />

            {/* Reveal Modal */}
            <RevealSabotageModal
                open={showRevealModal}
                onOpenChange={setShowRevealModal}
                cost={sabotage?.reveal_cost ?? 10}
                currentPoints={currentPoints}
                onSuccess={handleRevealSuccess}
            />

            {/* Game info modal */}
            <GameInfoModal
                open={showInfoModal}
                onOpenChange={setShowInfoModal}
                content={PLAYERS_INFO}
            />
        </PlayLayout>
    );
}

interface PlayerCardProps {
    player: PlayerData;
    onSabotage: () => void;
    sabotageEnabled: boolean;
}

function PlayerCard({ player, onSabotage, sabotageEnabled }: PlayerCardProps) {
    const medals = ['🥇', '🥈', '🥉'];
    const medal = player.rank <= 3 ? medals[player.rank - 1] : null;

    const isPodium = player.rank <= 3;
    const avatarSize = isPodium ? 'size-11' : 'size-9';
    const textSize = isPodium ? 'text-xl' : 'text-base';

    const showSabotageButton =
        !player.is_current &&
        (player.can_sabotage || player.has_pending_sabotage);

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
            <PlayerAvatar
                name={player.name}
                avatarUrl={player.avatar_url}
                className={cn(
                    avatarSize,
                    'border-2 border-background shadow-sm',
                )}
                fallbackClassName={cn(
                    'bg-primary-light',
                    isPodium ? 'text-sm' : 'text-xs',
                )}
            />

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
                <span
                    className={cn(
                        'font-display font-bold text-foreground',
                        textSize,
                    )}
                >
                    {player.points}
                </span>
                <p className="text-xs text-muted-foreground">pts</p>
            </div>

            {/* Sabotage button */}
            {showSabotageButton && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="ml-1 shrink-0">
                                {player.has_pending_sabotage ? (
                                    <div
                                        className="flex size-9 items-center justify-center rounded-full bg-destructive/10 motion-safe:animate-pulse"
                                        aria-label="Sabotage actief"
                                    >
                                        <Skull className="size-4 text-destructive" />
                                    </div>
                                ) : player.can_sabotage && sabotageEnabled ? (
                                    <button
                                        onClick={onSabotage}
                                        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/50"
                                        aria-label={`Saboteer ${player.name}`}
                                        data-testid={`sabotage-${player.name}`}
                                    >
                                        <Skull className="size-4" />
                                    </button>
                                ) : null}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            {player.has_pending_sabotage
                                ? 'Sabotage actief - wacht op volgende vraag'
                                : 'Saboteer (10 pts)'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}
