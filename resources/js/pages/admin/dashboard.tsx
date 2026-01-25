import { AdminHeader } from '@/components/admin-header';
import { SkipLink } from '@/components/skip-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { Clock, FlaskConical, Mail, Play, Trophy, Users } from 'lucide-react';

type GameStatus = 'draft' | 'pending' | 'active' | 'completed';

interface GameData {
    id: number;
    secret_word: string;
    status: GameStatus;
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
            <SkipLink />
            <div className="min-h-svh bg-background">
                <AdminHeader
                    title="Admin Dashboard"
                    subtitle="Beheer Skwix spellen"
                    actions={
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.post('/test/start')}
                                className="gap-2"
                            >
                                <FlaskConical className="size-4" />
                                Test Mode
                            </Button>
                            <Button asChild>
                                <Link href="/admin/create">Nieuw Spel</Link>
                            </Button>
                        </div>
                    }
                />

                <main id="main-content" tabIndex={-1} className="pb-safe p-6 outline-none">
                    {games.length === 0 ? (
                        <div className="mx-auto max-w-md py-12">
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="flex gap-1">
                                        {['S', 'T', 'A', 'R', 'T'].map(
                                            (letter, i) => (
                                                <div
                                                    key={i}
                                                    className="flex size-10 items-center justify-center rounded bg-primary/10 font-mono text-lg font-bold text-primary"
                                                >
                                                    {letter}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-center font-display text-xl font-bold text-foreground">
                                Begin je eerste spel
                            </h2>
                            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                                Kies een geheim woord, nodig spelers uit, en
                                plan wanneer het spel begint. Spelers raden het
                                woord via Wordle-puzzels en ja/nee vragen.
                            </p>
                            <div className="mt-6 space-y-2 text-sm">
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                        1
                                    </span>
                                    <span className="text-foreground">
                                        Kies een 5-letter woord
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                        2
                                    </span>
                                    <span className="text-foreground">
                                        Stel spelers + starttijd in
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                        3
                                    </span>
                                    <span className="text-foreground">
                                        Deel de uitnodigingscodes
                                    </span>
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <Link href="/admin/create">
                                    <Button size="lg">
                                        Maak je eerste spel
                                    </Button>
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

const statusConfig: Record<
    GameStatus,
    {
        label: string;
        className: string;
        icon: typeof Mail;
        hint: string;
    }
> = {
    draft: {
        label: 'Concept',
        className: 'bg-warning/15 text-[oklch(45%_0.15_85)] border-warning/30',
        icon: Mail,
        hint: 'Nodig spelers uit',
    },
    pending: {
        label: 'Uitgenodigd',
        className: 'bg-primary/15 text-primary border-primary/30',
        icon: Clock,
        hint: 'Wacht op starttijd',
    },
    active: {
        label: 'Actief',
        className: 'bg-success/15 text-[oklch(40%_0.15_145)] border-success/30',
        icon: Play,
        hint: 'Spel is bezig',
    },
    completed: {
        label: 'Voltooid',
        className: 'bg-muted text-muted-foreground border-border',
        icon: Trophy,
        hint: 'Spel afgelopen',
    },
};

function GameCard({ game }: { game: GameData }) {
    const config = statusConfig[game.status];
    const StatusIcon = config.icon;
    const startsAt = game.starts_at ? new Date(game.starts_at) : null;

    return (
        <Link
            href={`/admin/game/${game.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-card/80"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-lg font-semibold uppercase tracking-wider text-foreground">
                            {game.secret_word}
                        </span>
                        <Badge
                            variant="outline"
                            className={cn('gap-1', config.className)}
                        >
                            <StatusIcon className="size-3" />
                            {config.label}
                        </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5" />
                            {game.player_count} spelers
                        </span>
                        {startsAt && (
                            <span className="inline-flex items-center gap-1">
                                <Clock className="size-3.5" />
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
                <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-muted-foreground">
                        {config.hint}
                    </span>
                </div>
            </div>
        </Link>
    );
}
