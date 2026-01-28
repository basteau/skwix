import { AdminHeader } from '@/components/admin-header';
import { getAvatarUrl } from '@/components/avatar-picker';
import { SkipLink } from '@/components/skip-link';
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
import { toast } from '@/components/ui/sonner';
import { getInitials } from '@/hooks/use-initials';
import { cn, getCsrfToken } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Lightbulb,
    Loader2,
    Mail,
    Plus,
    Power,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WordValidation {
    valid: boolean;
    message: string;
    suggestions: string[];
    loading: boolean;
}

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

interface NotificationData {
    id: number;
    message: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    game: GameData;
    players: PlayerData[];
    notifications: NotificationData[];
}

export default function AdminGameDetail({
    game,
    players,
    notifications: initialNotifications,
}: Props) {
    const [wordleWords, setWordleWords] = useState<string[]>(
        game.wordle_words.map((w) => w.toLowerCase()),
    );
    const [wordValidations, setWordValidations] = useState<
        Record<number, WordValidation>
    >({});
    const validationTimers = useRef<Record<number, NodeJS.Timeout>>({});
    const [isUpdatingWords, setIsUpdatingWords] = useState(false);
    const [isEndingGame, setIsEndingGame] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(
        null,
    );
    const [resendingPlayerId, setResendingPlayerId] = useState<number | null>(
        null,
    );

    // Notification state
    const [notifications, setNotifications] =
        useState<NotificationData[]>(initialNotifications);
    const [newNotificationMessage, setNewNotificationMessage] = useState('');
    const [isAddingNotification, setIsAddingNotification] = useState(false);
    const [togglingNotificationId, setTogglingNotificationId] = useState<
        number | null
    >(null);
    const [deletingNotificationId, setDeletingNotificationId] = useState<
        number | null
    >(null);

    useEffect(() => {
        const timers = validationTimers.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

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

    const validateWord = useCallback(async (word: string, index: number) => {
        if (word.length !== 5) {
            setWordValidations((prev) => ({
                ...prev,
                [index]: {
                    valid: false,
                    message: 'Woord moet 5 letters zijn',
                    suggestions: [],
                    loading: false,
                },
            }));
            return;
        }

        setWordValidations((prev) => ({
            ...prev,
            [index]: { ...prev[index], loading: true },
        }));

        try {
            const res = await fetch(
                `/admin/validate-word?word=${encodeURIComponent(word)}`,
            );
            const data = await res.json();
            setWordValidations((prev) => ({
                ...prev,
                [index]: { ...data, loading: false },
            }));
        } catch {
            setWordValidations((prev) => ({
                ...prev,
                [index]: {
                    valid: false,
                    message: 'Validatie mislukt',
                    suggestions: [],
                    loading: false,
                },
            }));
        }
    }, []);

    const updateWordleWord = useCallback(
        (index: number, value: string) => {
            const word = value.toLowerCase();
            setWordleWords((prev) =>
                prev.map((w, i) => (i === index ? word : w)),
            );

            if (validationTimers.current[index]) {
                clearTimeout(validationTimers.current[index]);
            }

            if (word.length === 5) {
                validationTimers.current[index] = setTimeout(() => {
                    validateWord(word, index);
                }, 300);
            } else {
                setWordValidations((prev) => ({
                    ...prev,
                    [index]: {
                        valid: false,
                        message: '',
                        suggestions: [],
                        loading: false,
                    },
                }));
            }
        },
        [validateWord],
    );

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
        router.post(
            `/admin/game/${game.id}/invite`,
            {},
            {
                onFinish: () => {
                    setIsInviting(false);
                    setInviteDialogOpen(false);
                },
            },
        );
    }, [game.id]);

    const handleResendInvitation = useCallback(
        (playerId: number) => {
            setResendingPlayerId(playerId);
            router.post(
                `/admin/game/${game.id}/player/${playerId}/resend`,
                {},
                {
                    onFinish: () => setResendingPlayerId(null),
                },
            );
        },
        [game.id],
    );

    const handleAddNotification = useCallback(async () => {
        if (!newNotificationMessage.trim() || isAddingNotification) return;

        setIsAddingNotification(true);
        try {
            const response = await fetch(`/admin/game/${game.id}/notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ message: newNotificationMessage.trim() }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setNotifications((prev) => [data.notification, ...prev]);
                setNewNotificationMessage('');
                toast.success('Notificatie toegevoegd');
            } else {
                toast.error(data.message || 'Er ging iets mis');
            }
        } catch {
            toast.error('Verbinding mislukt');
        } finally {
            setIsAddingNotification(false);
        }
    }, [game.id, newNotificationMessage, isAddingNotification]);

    const handleToggleNotification = useCallback(
        async (notificationId: number) => {
            if (togglingNotificationId) return;

            setTogglingNotificationId(notificationId);
            try {
                const response = await fetch(
                    `/admin/game/${game.id}/notification/${notificationId}/toggle`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': getCsrfToken(),
                            Accept: 'application/json',
                        },
                    },
                );

                const data = await response.json();

                if (response.ok && data.success) {
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === notificationId
                                ? { ...n, is_active: data.is_active }
                                : n,
                        ),
                    );
                    toast.success(
                        data.is_active
                            ? 'Notificatie geactiveerd'
                            : 'Notificatie gedeactiveerd',
                    );
                } else {
                    toast.error(data.message || 'Er ging iets mis');
                }
            } catch {
                toast.error('Verbinding mislukt');
            } finally {
                setTogglingNotificationId(null);
            }
        },
        [game.id, togglingNotificationId],
    );

    const handleDeleteNotification = useCallback(
        async (notificationId: number) => {
            if (deletingNotificationId) return;

            setDeletingNotificationId(notificationId);
            try {
                const response = await fetch(
                    `/admin/game/${game.id}/notification/${notificationId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': getCsrfToken(),
                            Accept: 'application/json',
                        },
                    },
                );

                const data = await response.json();

                if (response.ok && data.success) {
                    setNotifications((prev) =>
                        prev.filter((n) => n.id !== notificationId),
                    );
                    toast.success('Notificatie verwijderd');
                } else {
                    toast.error(data.message || 'Er ging iets mis');
                }
            } catch {
                toast.error('Verbinding mislukt');
            } finally {
                setDeletingNotificationId(null);
            }
        },
        [game.id, deletingNotificationId],
    );

    const startsAt = game.starts_at ? new Date(game.starts_at) : null;
    const endsAt = game.ends_at ? new Date(game.ends_at) : null;

    const tiedLeaders = (() => {
        if (players.length < 2) return [];
        const topScore = players[0]?.points ?? 0;
        const tied = players.filter((p) => p.points === topScore);
        return tied.length > 1 ? tied : [];
    })();

    const showTieWarning = tiedLeaders.length > 1 && !selectedWinnerId;

    return (
        <>
            <Head title={`Spel: ${game.secret_word} - Admin`} />
            <SkipLink />
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

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto max-w-4xl p-6 pb-[calc(1.5rem+var(--safe-bottom))] outline-none"
                >
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
                                            Verstuur uitnodigingsmails naar alle{' '}
                                            {players.length} spelers. Het spel
                                            kan daarna niet meer aangepast
                                            worden.
                                        </p>
                                    </div>
                                    <Dialog
                                        open={inviteDialogOpen}
                                        onOpenChange={setInviteDialogOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button className="shrink-0 gap-2">
                                                <Mail className="size-4" />
                                                Uitnodigen
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Uitnodigingen versturen?
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Er worden {players.length}{' '}
                                                    uitnodigingsmails verstuurd
                                                    naar:
                                                </DialogDescription>
                                            </DialogHeader>
                                            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                                                {players.map((player) => (
                                                    <li
                                                        key={player.id}
                                                        className="flex items-center gap-2 text-muted-foreground"
                                                    >
                                                        <span className="font-medium text-foreground">
                                                            {player.name}
                                                        </span>
                                                        <span className="text-xs">
                                                            ({player.email})
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="outline"
                                                        disabled={isInviting}
                                                    >
                                                        Annuleren
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    onClick={
                                                        handleInvitePlayers
                                                    }
                                                    disabled={isInviting}
                                                >
                                                    {isInviting
                                                        ? 'Versturen...'
                                                        : 'Bevestigen'}
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
                            <div className="grid gap-3 sm:grid-cols-3">
                                {wordleWords.map((word, i) => {
                                    const validation = wordValidations[i];
                                    const showStatus =
                                        word.length === 5 &&
                                        validation &&
                                        game.status === 'draft';
                                    return (
                                        <div key={i}>
                                            <label className="mb-1 block text-xs text-muted-foreground">
                                                Dag {i + 1}
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    value={word}
                                                    onChange={(e) =>
                                                        updateWordleWord(
                                                            i,
                                                            e.target.value,
                                                        )
                                                    }
                                                    maxLength={5}
                                                    className={cn(
                                                        'pr-9 font-mono uppercase',
                                                        showStatus &&
                                                            validation.valid &&
                                                            'border-green-500 focus-visible:ring-green-500',
                                                        showStatus &&
                                                            !validation.valid &&
                                                            !validation.loading &&
                                                            'border-destructive focus-visible:ring-destructive',
                                                    )}
                                                    disabled={
                                                        game.status !== 'draft'
                                                    }
                                                />
                                                {showStatus && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                        {validation.loading ? (
                                                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                        ) : validation.valid ? (
                                                            <CheckCircle2 className="size-4 text-green-500" />
                                                        ) : (
                                                            <XCircle className="size-4 text-destructive" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {showStatus &&
                                                !validation.valid &&
                                                !validation.loading &&
                                                validation.suggestions.length >
                                                    0 && (
                                                    <div className="mt-1.5 text-xs">
                                                        <span className="text-muted-foreground">
                                                            Suggesties:{' '}
                                                        </span>
                                                        {validation.suggestions.map(
                                                            (s, si) => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        updateWordleWord(
                                                                            i,
                                                                            s,
                                                                        );
                                                                        validateWord(
                                                                            s,
                                                                            i,
                                                                        );
                                                                    }}
                                                                    className="font-mono text-primary uppercase hover:underline"
                                                                >
                                                                    {s}
                                                                    {si <
                                                                        validation
                                                                            .suggestions
                                                                            .length -
                                                                            1 &&
                                                                        ', '}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
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
                                                            src={getAvatarUrl(
                                                                player.avatar_url,
                                                            )}
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
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {player.invite_code}
                                                </span>
                                                {game.status !== 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() =>
                                                            handleResendInvitation(
                                                                player.id,
                                                            )
                                                        }
                                                        disabled={
                                                            resendingPlayerId ===
                                                            player.id
                                                        }
                                                        title="Uitnodiging opnieuw versturen"
                                                    >
                                                        {resendingPlayerId ===
                                                        player.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Mail className="size-4" />
                                                        )}
                                                    </Button>
                                                )}
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

                        {/* Notifications */}
                        {game.status !== 'completed' && (
                            <section className="rounded-lg border border-primary/30 bg-primary/5 p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <Bell className="size-5 text-primary" />
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Notificaties
                                    </h2>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Stuur een bericht naar alle spelers. Het
                                    bericht wordt als toast getoond en in de
                                    chat weergegeven.
                                </p>

                                {/* Add notification form */}
                                <div className="mb-4 flex gap-2">
                                    <Input
                                        value={newNotificationMessage}
                                        onChange={(e) =>
                                            setNewNotificationMessage(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Typ je bericht hier..."
                                        maxLength={500}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                handleAddNotification();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleAddNotification}
                                        disabled={
                                            isAddingNotification ||
                                            !newNotificationMessage.trim()
                                        }
                                        className="shrink-0 gap-2"
                                    >
                                        {isAddingNotification ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Plus className="size-4" />
                                        )}
                                        Versturen
                                    </Button>
                                </div>

                                {/* Existing notifications */}
                                {notifications.length > 0 && (
                                    <div className="space-y-2">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    'flex items-start gap-3 rounded-lg border p-3',
                                                    notification.is_active
                                                        ? 'border-primary/30 bg-card'
                                                        : 'border-border bg-muted/50 opacity-60',
                                                )}
                                            >
                                                <Lightbulb
                                                    className={cn(
                                                        'mt-0.5 size-4 shrink-0',
                                                        notification.is_active
                                                            ? 'text-amber-500'
                                                            : 'text-muted-foreground',
                                                    )}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={cn(
                                                            'text-sm',
                                                            notification.is_active
                                                                ? 'text-foreground'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {notification.message}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {new Date(
                                                            notification.created_at,
                                                        ).toLocaleString(
                                                            'nl-BE',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() =>
                                                            handleToggleNotification(
                                                                notification.id,
                                                            )
                                                        }
                                                        disabled={
                                                            togglingNotificationId ===
                                                            notification.id
                                                        }
                                                        title={
                                                            notification.is_active
                                                                ? 'Deactiveren'
                                                                : 'Activeren'
                                                        }
                                                    >
                                                        {togglingNotificationId ===
                                                        notification.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Power
                                                                className={cn(
                                                                    'size-4',
                                                                    notification.is_active
                                                                        ? 'text-success'
                                                                        : 'text-muted-foreground',
                                                                )}
                                                            />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() =>
                                                            handleDeleteNotification(
                                                                notification.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingNotificationId ===
                                                            notification.id
                                                        }
                                                        title="Verwijderen"
                                                    >
                                                        {deletingNotificationId ===
                                                        notification.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {notifications.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Nog geen notificaties verstuurd
                                    </p>
                                )}
                            </section>
                        )}

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

                                {/* Tie warning */}
                                {showTieWarning && (
                                    <div className="mb-4 flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3">
                                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[oklch(50%_0.18_85)]" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                Gelijkspel gedetecteerd
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {tiedLeaders
                                                    .map((p) => p.name)
                                                    .join(' en ')}{' '}
                                                staan gelijk met{' '}
                                                {tiedLeaders[0]?.points} punten.
                                                Selecteer een winnaar of
                                                beëindig zonder winnaar.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-medium">
                                        Winnaar selecteren{' '}
                                        {tiedLeaders.length > 1
                                            ? '(aanbevolen)'
                                            : '(optioneel)'}
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
                                        <SelectTrigger
                                            className={cn(
                                                'max-w-xs',
                                                showTieWarning &&
                                                    'border-warning ring-1 ring-warning/20',
                                            )}
                                        >
                                            <SelectValue placeholder="Geen winnaar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Geen winnaar
                                            </SelectItem>
                                            {players.map((player) => {
                                                const isTied = tiedLeaders.some(
                                                    (t) => t.id === player.id,
                                                );
                                                return (
                                                    <SelectItem
                                                        key={player.id}
                                                        value={String(
                                                            player.id,
                                                        )}
                                                    >
                                                        {player.name} (
                                                        {player.points} punten)
                                                        {isTied && ' ⚡'}
                                                    </SelectItem>
                                                );
                                            })}
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
