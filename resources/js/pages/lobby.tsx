import { Head, router } from '@inertiajs/react';
import { Crown, Snowflake, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

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
        game?.starts_at ? calculateRemaining(game.starts_at) : null
    );

    useEffect(() => {
        if (!game?.starts_at) return;

        const interval = setInterval(() => {
            const remaining = calculateRemaining(game.starts_at!);
            setCountdown(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                router.visit('/play/wordle');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [game?.starts_at]);

    return (
        <>
            <Head title="Lobby - Skwix" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
                {/* Subtle snowflake decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]" aria-hidden>
                    <Snowflake className="absolute left-[8%] top-[12%] size-16 text-primary" />
                    <Snowflake className="absolute right-[12%] top-[8%] size-10 text-primary" />
                    <Snowflake className="absolute left-[15%] bottom-[15%] size-12 text-primary" />
                    <Snowflake className="absolute right-[8%] bottom-[25%] size-18 text-primary" />
                    <Snowflake className="absolute left-[50%] top-[5%] size-8 text-primary" />
                    <Snowflake className="absolute right-[30%] bottom-[10%] size-14 text-primary" />
                </div>

                <main className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
                    {/* Header */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="mb-4 flex items-center justify-center gap-3 text-primary">
                            <Users className="size-8" />
                            <Snowflake className="size-6 animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Wachten op spelers
                        </h1>
                        {player && (
                            <p className="mt-2 text-muted-foreground">
                                Welkom, <span className="font-medium text-foreground">{player.name}</span>!
                            </p>
                        )}
                    </div>

                    {/* Countdown */}
                    {countdown !== null && (
                        <div data-testid="countdown" className="mb-10 rounded-xl bg-primary/5 px-6 py-4 border border-primary/10">
                            <p className="text-sm text-muted-foreground mb-1">
                                Het spel begint over
                            </p>
                            <p className="text-3xl font-bold text-primary tabular-nums">
                                {formatCountdown(countdown)}
                            </p>
                        </div>
                    )}

                    {/* Players Grid */}
                    <div className="w-full">
                        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Aangemelde spelers ({players.length})
                        </h2>
                        
                        {players.length > 0 ? (
                            <div data-testid="player-list" className="grid grid-cols-2 gap-3">
                                {players.map((p, index) => {
                                    const isCurrentPlayer = p.id === player?.id;
                                    const isHost = index === 0;
                                    
                                    return (
                                        <div
                                            key={p.id}
                                            data-testid={`player-card-${p.id}`}
                                            className={cn(
                                                'relative flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm',
                                                'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
                                                isCurrentPlayer && 'ring-2 ring-primary shadow-md',
                                                isHost && !isCurrentPlayer && 'border-primary/30'
                                            )}
                                            style={{
                                                animationDelay: `${index * 100}ms`,
                                                animationFillMode: 'backwards',
                                            }}
                                        >
                                            {isHost && (
                                                <Crown 
                                                    className="absolute -top-2 -right-2 size-5 text-amber-500 drop-shadow-sm" 
                                                    aria-label="Host"
                                                />
                                            )}
                                            <Avatar className={cn(
                                                'size-10 border-2',
                                                isCurrentPlayer ? 'border-primary' : 'border-border'
                                            )}>
                                                <AvatarImage src={p.avatar_url || undefined} alt={p.name} />
                                                <AvatarFallback className={cn(
                                                    'text-sm font-medium',
                                                    isCurrentPlayer 
                                                        ? 'bg-primary text-primary-foreground' 
                                                        : 'bg-primary/10 text-primary'
                                                )}>
                                                    {getInitials(p.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={cn(
                                                'truncate text-sm font-medium',
                                                isCurrentPlayer ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {p.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed bg-muted/30 p-6">
                                <p className="text-sm text-muted-foreground">
                                    Nog geen spelers aangemeld...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <p className="mt-10 text-sm text-muted-foreground">
                        Blijf hier wachten — je wordt automatisch doorgestuurd.
                    </p>
                </main>
            </div>
        </>
    );
}
