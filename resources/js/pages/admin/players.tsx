import { AdminHeader } from '@/components/admin-header';
import { getAvatarUrl } from '@/components/avatar-picker';
import { SkipLink } from '@/components/skip-link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Search,
    UserCheck,
    UserX,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

type GameStatus = 'draft' | 'pending' | 'active' | 'completed';
type SortField =
    | 'name'
    | 'email'
    | 'invite_code'
    | 'game_id'
    | 'joined_at'
    | 'points';
type SortDirection = 'asc' | 'desc';

interface PlayerData {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    points: number;
    invite_code: string;
    joined_at: string | null;
    game_id: number;
    game_secret_word: string;
    game_status: GameStatus;
}

interface Props {
    players: PlayerData[];
}

const statusConfig: Record<GameStatus, { label: string; className: string }> = {
    draft: {
        label: 'Concept',
        className: 'bg-warning/15 text-[oklch(45%_0.15_85)] border-warning/30',
    },
    pending: {
        label: 'Uitgenodigd',
        className: 'bg-primary/15 text-primary border-primary/30',
    },
    active: {
        label: 'Actief',
        className: 'bg-success/15 text-[oklch(40%_0.15_145)] border-success/30',
    },
    completed: {
        label: 'Voltooid',
        className: 'bg-muted text-muted-foreground border-border',
    },
};

function SortIcon({
    field,
    sortField,
    sortDirection,
}: {
    field: SortField;
    sortField: SortField;
    sortDirection: SortDirection;
}) {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
        <ChevronUp className="size-3.5" />
    ) : (
        <ChevronDown className="size-3.5" />
    );
}

export default function AdminPlayers({ players }: Props) {
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleSort = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
            } else {
                setSortField(field);
                setSortDirection('asc');
            }
        },
        [sortField],
    );

    const handleCopyCode = useCallback(async (id: number, code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            // Silently fail
        }
    }, []);

    const filteredPlayers = useMemo(() => {
        const searchLower = search.toLowerCase();
        return players.filter(
            (p) =>
                p.name.toLowerCase().includes(searchLower) ||
                p.email.toLowerCase().includes(searchLower) ||
                p.invite_code.toLowerCase().includes(searchLower) ||
                p.game_secret_word.toLowerCase().includes(searchLower),
        );
    }, [players, search]);

    const sortedPlayers = useMemo(() => {
        return [...filteredPlayers].sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'email':
                    comparison = a.email.localeCompare(b.email);
                    break;
                case 'invite_code':
                    comparison = a.invite_code.localeCompare(b.invite_code);
                    break;
                case 'game_id':
                    comparison = a.game_id - b.game_id;
                    break;
                case 'joined_at':
                    if (!a.joined_at && !b.joined_at) comparison = 0;
                    else if (!a.joined_at) comparison = 1;
                    else if (!b.joined_at) comparison = -1;
                    else
                        comparison =
                            new Date(a.joined_at).getTime() -
                            new Date(b.joined_at).getTime();
                    break;
                case 'points':
                    comparison = a.points - b.points;
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredPlayers, sortField, sortDirection]);

    return (
        <>
            <Head title="Alle Spelers - Admin" />
            <SkipLink />
            <div className="min-h-svh bg-background">
                <AdminHeader
                    title="Alle Spelers"
                    subtitle={`${players.length} spelers in totaal`}
                    backHref="/admin"
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/admin' },
                        { label: 'Alle Spelers' },
                    ]}
                />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="pb-safe p-6 outline-none"
                >
                    <div className="relative mb-6">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Zoeken op naam, email, code of spel..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                            data-testid="player-search-input"
                        />
                    </div>

                    {sortedPlayers.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            {search
                                ? 'Geen spelers gevonden'
                                : 'Nog geen spelers'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('name')
                                                }
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Speler
                                                <SortIcon
                                                    field="name"
                                                    sortField={sortField}
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                />
                                            </button>
                                        </th>
                                        <th className="hidden p-3 text-left font-medium text-muted-foreground md:table-cell">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('email')
                                                }
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Email
                                                <SortIcon
                                                    field="email"
                                                    sortField={sortField}
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                />
                                            </button>
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('invite_code')
                                                }
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Code
                                                <SortIcon
                                                    field="invite_code"
                                                    sortField={sortField}
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                />
                                            </button>
                                        </th>
                                        <th className="hidden p-3 text-left font-medium text-muted-foreground sm:table-cell">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('game_id')
                                                }
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Spel
                                                <SortIcon
                                                    field="game_id"
                                                    sortField={sortField}
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                />
                                            </button>
                                        </th>
                                        <th className="hidden p-3 text-center font-medium text-muted-foreground lg:table-cell">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('joined_at')
                                                }
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Status
                                                <SortIcon
                                                    field="joined_at"
                                                    sortField={sortField}
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                />
                                            </button>
                                        </th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSort('points')
                                                }
                                                className="inline-flex items-center gap-1 hover:text-foreground"
                                            >
                                                Punten
                                                <SortIcon
                                                    field="points"
                                                    sortField={sortField}
                                                    sortDirection={
                                                        sortDirection
                                                    }
                                                />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPlayers.map((player) => (
                                        <tr
                                            key={player.id}
                                            className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                                            data-testid={`player-row-${player.id}`}
                                        >
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-8 border border-border">
                                                        <AvatarImage
                                                            src={getAvatarUrl(
                                                                player.avatar_url,
                                                            )}
                                                            alt={player.name}
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                                            {getInitials(
                                                                player.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-foreground">
                                                            {player.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground md:hidden">
                                                            {player.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden p-3 text-muted-foreground md:table-cell">
                                                {player.email}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-xs tracking-wider text-foreground">
                                                        {player.invite_code}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() =>
                                                            handleCopyCode(
                                                                player.id,
                                                                player.invite_code,
                                                            )
                                                        }
                                                        data-testid={`copy-code-${player.id}`}
                                                    >
                                                        {copiedId ===
                                                        player.id ? (
                                                            <Check className="size-3.5 text-success" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="hidden p-3 sm:table-cell">
                                                <Link
                                                    href={`/admin/game/${player.game_id}`}
                                                    className="group inline-flex items-center gap-2"
                                                >
                                                    <span className="font-mono text-xs tracking-wider text-foreground uppercase group-hover:text-primary">
                                                        {
                                                            player.game_secret_word
                                                        }
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px]',
                                                            statusConfig[
                                                                player
                                                                    .game_status
                                                            ].className,
                                                        )}
                                                    >
                                                        {
                                                            statusConfig[
                                                                player
                                                                    .game_status
                                                            ].label
                                                        }
                                                    </Badge>
                                                </Link>
                                            </td>
                                            <td className="hidden p-3 text-center lg:table-cell">
                                                {player.joined_at ? (
                                                    <span className="inline-flex items-center gap-1 text-success">
                                                        <UserCheck className="size-4" />
                                                        <span className="text-xs">
                                                            Joined
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                        <UserX className="size-4" />
                                                        <span className="text-xs">
                                                            Pending
                                                        </span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right font-mono text-foreground">
                                                {player.points}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
