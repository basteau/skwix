import { AdminHeader } from '@/components/admin-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { useCallback, useState } from 'react';

interface PlayerData {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    points: number;
    invite_code: string;
    joined_at: string | null;
    wordle_completed: number;
    questions_asked: number;
    spins_count: number;
}

interface GameData {
    id: number;
    secret_word: string;
    status: 'draft' | 'pending' | 'active' | 'completed';
    starts_at: string | null;
    ends_at: string | null;
    wordle_words: string[];
    winner: { id: number; name: string } | null;
}

interface Props {
    game: GameData;
    players: PlayerData[];
}

export default function AdminGameDetail({ game, players }: Props) {
    const [wordleWords, setWordleWords] = useState<string[]>(game.wordle_words);
    const [isUpdatingWords, setIsUpdatingWords] = useState(false);
    const [isEndingGame, setIsEndingGame] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(
        null,
    );

    const statusColors: Record<string, string> = {
        draft: 'bg-warning/15 text-[oklch(45%_0.15_85)]',
        pending: 'bg-primary/15 text-primary',
        active: 'bg-success/15 text-[oklch(40%_0.15_145)]',
        completed: 'bg-muted text-muted-foreground',
    };

    const statusLabels: Record<string, string> = {
        draft: 'Concept',
        pending: 'Uitgenodigd',
        active: 'Actief',
        completed: 'Voltooid',
    };

    const updateWordleWord = useCallback((index: number, value: string) => {
        setWordleWords((prev) =>
            prev.map((w, i) => (i === index ? value.toLowerCase() : w)),
        );
    }, []);

    const handleSaveWordleWords = useCallback(() => {
        setIsUpdatingWords(true);
        router.put(
            `/admin/game/${game.id}/wordle-words`,
            { wordle_words: wordleWords },
            {
                onFinish: () => setIsUpdatingWords(false),
            },
        );
    }, [game.id, wordleWords]);

    const handleEndGame = useCallback(() => {
        if (!confirm('Weet je zeker dat je dit spel wilt beëindigen?')) return;
        setIsEndingGame(true);
        router.post(
            `/admin/game/${game.id}/end`,
            { winner_id: selectedWinnerId },
            {
                onFinish: () => setIsEndingGame(false),
            },
        );
    }, [game.id, selectedWinnerId]);

    const handleInvitePlayers = useCallback(() => {
        setIsInviting(true);
        router.post(`/admin/game/${game.id}/invite`, {}, {
            onFinish: () => {
                setIsInviting(false);
                setInviteDialogOpen(false);
            },
        });
    }, [game.id]);

    const startsAt = game.starts_at ? new Date(game.starts_at) : null;
    const endsAt = game.ends_at ? new Date(game.ends_at) : null;

    return (
        <>
            <Head title={`Spel: ${game.secret_word} - Admin`} />
            <div className="min-h-svh bg-background">
                <AdminHeader
                    title={game.secret_word}
                    backHref="/admin"
                    breadcrumbs={[
                        { label: 'Spellen', href: '/admin' },
                        { label: game.secret_word },
                    ]}
                    badge={
                        <span
                            className={cn(
                                'rounded-full px-2.5 py-1 text-xs font-medium',
                                statusColors[game.status],
                            )}
                        >
                            {statusLabels[game.status]}
                        </span>
                    }
                />

                <main className="mx-auto max-w-4xl p-6 pb-[calc(1.5rem+var(--safe-bottom))]">
                    <div className="space-y-8">
                        {/* Invite Players - Only for draft games */}
                        {game.status === 'draft' && (
                            <section className="rounded-lg border border-primary/30 bg-primary/5 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Spelers Uitnodigen
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Verstuur uitnodigingsmails naar alle {players.length} spelers.
                                            Het spel kan daarna niet meer aangepast worden.
                                        </p>
                                    </div>
                                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="shrink-0 gap-2">
                                                <Mail className="size-4" />
                                                Uitnodigen
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Uitnodigingen versturen?</DialogTitle>
                                                <DialogDescription>
                                                    Er worden {players.length} uitnodigingsmails verstuurd naar:
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                                                {players.map((player) => (
                                                    <li key={player.id} className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="font-medium text-foreground">{player.name}</span>
                                                        <span className="text-xs">({player.email})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline" disabled={isInviting}>
                                                        Annuleren
                                                    </Button>
                                                </DialogClose>
                                                <Button onClick={handleInvitePlayers} disabled={isInviting}>
                                                    {isInviting ? 'Versturen...' : 'Bevestigen'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </section>
                        )}

                        {/* Game Info */}
                        <section className="rounded-lg border border-border bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold text-foreground">
                                Spel Info
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <span className="text-sm text-muted-foreground">
                                        Geheim Woord
                                    </span>
                                    <p className="font-mono text-lg font-semibold uppercase">
                                        {game.secret_word}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">
                                        Aantal Spelers
                                    </span>
                                    <p className="text-lg font-semibold">
                                        {players.length}
                                    </p>
                                </div>
                                {startsAt && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">
                                            Start
                                        </span>
                                        <p className="font-medium">
                                            {startsAt.toLocaleDateString(
                                                'nl-BE',
                                                {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                },
                                            )}
                                        </p>
                                    </div>
                                )}
                                {endsAt && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">
                                            Einde
                                        </span>
                                        <p className="font-medium">
                                            {endsAt.toLocaleDateString(
                                                'nl-BE',
                                                {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                },
                                            )}
                                        </p>
                                    </div>
                                )}
                                {game.winner && (
                                    <div className="sm:col-span-2">
                                        <span className="text-sm text-muted-foreground">
                                            Winnaar
                                        </span>
                                        <p className="text-lg font-semibold text-green-600">
                                            🏆 {game.winner.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Wordle Words */}
                        <section className="rounded-lg border border-border bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold text-foreground">
                                Wordle Woorden
                            </h2>
                            {game.status !== 'draft' && (
                                <p className="mb-4 text-sm text-muted-foreground">
                                    {game.status === 'completed'
                                        ? 'Wordle woorden kunnen niet meer worden aangepast na afloop van het spel.'
                                        : 'Wordle woorden kunnen niet meer worden aangepast nadat uitnodigingen zijn verstuurd.'}
                                </p>
                            )}
                            <div className="grid gap-2 sm:grid-cols-3">
                                {wordleWords.map((word, i) => (
                                    <div key={i}>
                                        <label className="mb-1 block text-xs text-muted-foreground">
                                            Dag {i + 1}
                                        </label>
                                        <Input
                                            value={word}
                                            onChange={(e) =>
                                                updateWordleWord(
                                                    i,
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={5}
                                            className="font-mono uppercase"
                                            disabled={game.status !== 'draft'}
                                        />
                                    </div>
                                ))}
                            </div>
                            {game.status === 'draft' && (
                                <Button
                                    onClick={handleSaveWordleWords}
                                    disabled={isUpdatingWords}
                                    className="mt-4"
                                >
                                    {isUpdatingWords
                                        ? 'Opslaan...'
                                        : 'Woorden Opslaan'}
                                </Button>
                            )}
                        </section>

                        {/* Players */}
                        <section className="rounded-lg border border-border bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold text-foreground">
                                Spelers Overzicht
                            </h2>
                            <div className="space-y-3">
                                {players.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className={cn(
                                            'rounded-lg border p-4',
                                            index === 0 &&
                                                'border-amber-300/50 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20',
                                            index === 1 &&
                                                'border-zinc-300/50 bg-zinc-50 dark:border-zinc-600/50 dark:bg-zinc-800/30',
                                            index === 2 &&
                                                'border-orange-300/50 bg-orange-50 dark:border-orange-700/50 dark:bg-orange-900/20',
                                            index > 2 &&
                                                'border-border bg-background',
                                        )}
                                    >
                                        {/* Player info row */}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="size-10 border-2 border-border">
                                                        <AvatarImage
                                                            src={
                                                                player.avatar_url ||
                                                                undefined
                                                            }
                                                            alt={player.name}
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {getInitials(
                                                                player.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-bold shadow-sm ring-1 ring-border">
                                                        {index === 0 && '🥇'}
                                                        {index === 1 && '🥈'}
                                                        {index === 2 && '🥉'}
                                                        {index > 2 && index + 1}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-foreground">
                                                        {player.name}
                                                    </p>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {player.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 font-mono text-xs text-muted-foreground">
                                                {player.invite_code}
                                            </div>
                                        </div>
                                        {/* Stats row */}
                                        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border/50 pt-3 text-sm">
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.points}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Punten
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.wordle_completed}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Wordles
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.questions_asked}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Vragen
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.spins_count}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Spins
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* End Game */}
                        {game.status !== 'completed' && (
                            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
                                <h2 className="mb-4 text-lg font-semibold text-destructive">
                                    Spel Beëindigen
                                </h2>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Beëindig het spel handmatig. Selecteer
                                    optioneel een winnaar.
                                </p>
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-medium">
                                        Winnaar selecteren (optioneel)
                                    </label>
                                    <Select
                                        value={
                                            selectedWinnerId
                                                ? String(selectedWinnerId)
                                                : 'none'
                                        }
                                        onValueChange={(value) =>
                                            setSelectedWinnerId(
                                                value && value !== 'none'
                                                    ? parseInt(value, 10)
                                                    : null,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="max-w-xs">
                                            <SelectValue placeholder="Geen winnaar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Geen winnaar
                                            </SelectItem>
                                            {players.map((player) => (
                                                <SelectItem
                                                    key={player.id}
                                                    value={String(player.id)}
                                                >
                                                    {player.name} (
                                                    {player.points} punten)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleEndGame}
                                    disabled={isEndingGame}
                                >
                                    {isEndingGame
                                        ? 'Beëindigen...'
                                        : 'Spel Beëindigen'}
                                </Button>
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
