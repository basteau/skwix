import { getAvatarUrl } from '@/components/avatar-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, Crown, Snowflake } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Player {
    id: number;
    name: string;
    avatar_url: string | null;
}

interface LobbyProps {
    player?: {
        id: number;
        name: string;
    };
    game?: {
        id: number;
        status: string;
        starts_at: string | null;
    };
    players?: Player[];
}

function formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'Nu!';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}u ${mins}m`;
    }
    if (hours > 0) {
        return `${hours}u ${mins}m ${secs}s`;
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

export default function Lobby({ player, game, players = [] }: LobbyProps) {
    const calculateRemaining = (startsAt: string) => {
        const startTime = new Date(startsAt).getTime();
        const now = Date.now();
        return Math.max(0, Math.floor((startTime - now) / 1000));
    };

    const [countdown, setCountdown] = useState<number | null>(() =>
        game?.starts_at ? calculateRemaining(game.starts_at) : null,
    );
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const statusMessage = useMemo(() => {
        if (!game) return null;
        if (game.status === 'completed') return 'Dit spel is al afgelopen.';
        if (game.status === 'draft' || game.status === 'cancelled')
            return 'Dit spel is geannuleerd.';
        return null;
    }, [game]);

    useEffect(() => {
        if (!game) return;

        if (game.status === 'active') {
            router.visit('/play/wordle');
            return;
        }

        if (
            game.status === 'completed' ||
            game.status === 'draft' ||
            game.status === 'cancelled'
        ) {
            return;
        }

        pollIntervalRef.current = setInterval(() => {
            router.reload({ only: ['game', 'players'] });
        }, 7000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [game]);

    useEffect(() => {
        if (!game?.starts_at) return;

        const interval = setInterval(() => {
            const remaining = calculateRemaining(game.starts_at!);
            setCountdown(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                router.reload({ only: ['game', 'players'] });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [game?.starts_at]);

    return (
        <>
            <Head title="Lobby - Skwix" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-primary/[0.02] to-background px-6 py-12">
                {/* Animated snowflake decorations */}
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden
                >
                    <Snowflake
                        className="absolute top-[12%] left-[8%] size-16 text-primary opacity-[0.05] motion-safe:animate-pulse"
                        style={{ animationDuration: '4s' }}
                    />
                    <Snowflake
                        className="absolute top-[8%] right-[12%] size-10 text-primary opacity-[0.06] motion-safe:animate-pulse"
                        style={{
                            animationDuration: '5s',
                            animationDelay: '1s',
                        }}
                    />
                    <Snowflake
                        className="absolute bottom-[15%] left-[15%] size-12 text-primary opacity-[0.05] motion-safe:animate-pulse"
                        style={{
                            animationDuration: '6s',
                            animationDelay: '2s',
                        }}
                    />
                    <Snowflake
                        className="absolute right-[8%] bottom-[25%] size-18 text-primary opacity-[0.04] motion-safe:animate-pulse"
                        style={{
                            animationDuration: '5s',
                            animationDelay: '0.5s',
                        }}
                    />
                    <Snowflake
                        className="absolute top-[5%] left-[50%] size-8 text-primary opacity-[0.07] motion-safe:animate-pulse"
                        style={{
                            animationDuration: '4.5s',
                            animationDelay: '1.5s',
                        }}
                    />
                    <Snowflake
                        className="absolute right-[30%] bottom-[10%] size-14 text-primary opacity-[0.05] motion-safe:animate-pulse"
                        style={{
                            animationDuration: '5.5s',
                            animationDelay: '2.5s',
                        }}
                    />
                </div>

                <main className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
                    {/* Header with spinning snowflake */}
                    <div className="mb-8 flex flex-col items-center motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in">
                        <div className="mb-4">
                            <Snowflake
                                className="size-10 text-primary motion-safe:animate-spin"
                                style={{ animationDuration: '12s' }}
                            />
                        </div>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                            Wachtkamer
                        </h1>
                        {player && (
                            <p className="mt-2 text-muted-foreground">
                                Welkom,{' '}
                                <span className="font-medium text-primary">
                                    {player.name}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Status message for cancelled/completed games */}
                    {statusMessage && (
                        <div
                            data-testid="status-message"
                            className="mb-10 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-4 motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in"
                        >
                            <AlertCircle className="size-5 shrink-0 text-destructive" />
                            <p className="text-sm font-medium text-destructive">
                                {statusMessage}
                            </p>
                        </div>
                    )}

                    {/* Countdown */}
                    {countdown !== null && !statusMessage && (
                        <div
                            data-testid="countdown"
                            className="mb-10 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/10 px-8 py-5 shadow-sm motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in"
                        >
                            <p className="mb-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                                Start over
                            </p>
                            <p className="font-display text-4xl font-bold tracking-tight text-primary tabular-nums">
                                {formatCountdown(countdown)}
                            </p>
                        </div>
                    )}

                    {/* Players Grid */}
                    <div className="w-full motion-safe:animate-in motion-safe:delay-100 motion-safe:duration-700 motion-safe:fade-in">
                        <h2 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                            Spelers ({players.length})
                        </h2>

                        {players.length > 0 ? (
                            <div
                                data-testid="player-list"
                                className="grid grid-cols-2 gap-3"
                            >
                                {players.map((p, index) => {
                                    const isCurrentPlayer = p.id === player?.id;
                                    const isHost = index === 0;

                                    return (
                                        <div
                                            key={p.id}
                                            data-testid={`player-card-${p.id}`}
                                            className={cn(
                                                'relative flex items-center gap-3 rounded-xl border bg-card/80 p-3 transition-all',
                                                'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
                                                isCurrentPlayer &&
                                                    'border-primary/40 bg-primary/5 shadow-md ring-1 ring-primary/20',
                                                isHost &&
                                                    !isCurrentPlayer &&
                                                    'border-amber-400/30 bg-amber-50/30 dark:bg-amber-950/10',
                                                !isCurrentPlayer &&
                                                    !isHost &&
                                                    'border-border/60',
                                            )}
                                            style={{
                                                animationDelay: `${index * 80}ms`,
                                                animationFillMode: 'backwards',
                                            }}
                                        >
                                            {isHost && (
                                                <Crown
                                                    className="absolute -top-2 -right-2 size-5 text-amber-500 drop-shadow"
                                                    aria-label="Host"
                                                />
                                            )}
                                            <Avatar
                                                className={cn(
                                                    'size-11 border-2 shadow-sm',
                                                    isCurrentPlayer
                                                        ? 'border-primary'
                                                        : isHost
                                                          ? 'border-amber-400/60'
                                                          : 'border-border',
                                                )}
                                            >
                                                <AvatarImage
                                                    src={
                                                        getAvatarUrl(
                                                            p.avatar_url,
                                                        ) || undefined
                                                    }
                                                    alt={p.name}
                                                />
                                                <AvatarFallback
                                                    className={cn(
                                                        'text-sm font-semibold',
                                                        isCurrentPlayer
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-primary/10 text-primary',
                                                    )}
                                                >
                                                    {getInitials(p.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={cn(
                                                    'truncate text-sm font-medium',
                                                    isCurrentPlayer
                                                        ? 'text-primary'
                                                        : 'text-foreground',
                                                )}
                                            >
                                                {p.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] px-6 py-8">
                                <Snowflake className="mb-3 size-8 text-primary/30" />
                                <p className="text-sm text-muted-foreground">
                                    Nog niemand aangemeld
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    {!statusMessage && (
                        <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground motion-safe:animate-in motion-safe:delay-200 motion-safe:duration-700 motion-safe:fade-in">
                            <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary/50" />
                            Je wordt automatisch doorgestuurd
                        </p>
                    )}
                </main>
            </div>
        </>
    );
}
