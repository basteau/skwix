import { AdminHeader } from '@/components/admin-header';
import { getAvatarForName, getAvatarUrl } from '@/components/avatar-picker';
import { SkipLink } from '@/components/skip-link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DateTimePicker,
    getDefaultStartDate,
} from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { getInitials } from '@/hooks/use-initials';
import { Head, router } from '@inertiajs/react';
import { Search, UserPlus, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface AvailableUser {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    avatar_url: string | null;
}

interface Props {
    availableUsers: AvailableUser[];
}

interface PlayerRow {
    id: string;
    name: string;
    email: string;
    userId?: number;
    avatarUrl?: string | null;
}

export default function CreateGame({ availableUsers }: Props) {
    const [secretWord, setSecretWord] = useState('');
    const [startsAt, setStartsAt] = useState<Date | undefined>(
        getDefaultStartDate(),
    );
    const [players, setPlayers] = useState<PlayerRow[]>([
        { id: crypto.randomUUID(), name: '', email: '' },
        { id: crypto.randomUUID(), name: '', email: '' },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addPlayer = useCallback(() => {
        setPlayers((prev) => {
            if (prev.length >= 8) return prev;
            return [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    name: '',
                    email: '',
                },
            ];
        });
    }, []);

    const removePlayer = useCallback((id: string) => {
        setPlayers((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const updatePlayer = useCallback(
        (id: string, field: keyof PlayerRow, value: string) => {
            setPlayers((prev) =>
                prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
            );
        },
        [],
    );

    const selectExistingUser = useCallback(
        (playerId: string, user: AvailableUser) => {
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === playerId
                        ? {
                              ...p,
                              name: user.name,
                              email: user.email,
                              userId: user.id,
                              avatarUrl: user.avatar_url,
                          }
                        : p,
                ),
            );
        },
        [],
    );

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setErrors({});

        const validPlayers = players.filter((p) => p.name && p.email);
        if (validPlayers.length < 2) {
            setErrors({
                players: 'Minimum 2 spelers vereist',
            });
            setIsSubmitting(false);
            return;
        }

        const emails = validPlayers.map((p) => p.email.toLowerCase().trim());
        const uniqueEmails = new Set(emails);
        if (emails.length !== uniqueEmails.size) {
            setErrors({
                players: 'Elke speler moet een uniek e-mailadres hebben',
            });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            secret_word: secretWord,
            starts_at: startsAt?.toISOString() ?? '',
            players: validPlayers.map((p) => ({
                name: p.name,
                email: p.email,
            })),
        };

        try {
            await router.post('/admin/create', payload, {
                onError: (errs) => setErrors(errs as Record<string, string>),
                onFinish: () => setIsSubmitting(false),
            });
        } catch {
            setIsSubmitting(false);
        }
    }, [secretWord, startsAt, players]);

    return (
        <>
            <Head title="Nieuw Spel - Admin" />
            <SkipLink />
            <div className="min-h-svh bg-background">
                <AdminHeader
                    title="Nieuw Spel Aanmaken"
                    backHref="/admin"
                    breadcrumbs={[{ label: 'Nieuw Spel' }]}
                />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="pb-safe mx-auto max-w-2xl p-6 outline-none"
                >
                    <div className="space-y-8">
                        {/* Secret Word */}
                        <section>
                            <h2 className="mb-3 text-lg font-semibold text-foreground">
                                Mystery Woord
                            </h2>
                            <Input
                                value={secretWord}
                                onChange={(e) => setSecretWord(e.target.value)}
                                placeholder="Het woord dat spelers moeten raden"
                                className="text-lg"
                            />
                            {errors.secret_word && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.secret_word}
                                </p>
                            )}
                        </section>

                        {/* Timing */}
                        <section>
                            <h2 className="mb-3 text-lg font-semibold text-foreground">
                                Start
                            </h2>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">
                                    Start datum & tijd
                                </label>
                                <DateTimePicker
                                    value={startsAt}
                                    onChange={setStartsAt}
                                    placeholder="Selecteer datum & tijd"
                                    data-testid="starts-at-picker"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Het spel loopt totdat iemand het mystery
                                    woord raadt
                                </p>
                                {errors.starts_at && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.starts_at}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Players */}
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Spelers ({players.length}/8)
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addPlayer}
                                    disabled={players.length >= 8}
                                >
                                    <UserPlus className="mr-1 size-4" />
                                    Speler
                                </Button>
                            </div>

                            {/* Selected Players */}
                            <div className="mb-4 space-y-2">
                                {players.map((player, i) => (
                                    <div
                                        key={player.id}
                                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                                    >
                                        <Avatar className="size-10 shrink-0 border border-border">
                                            <AvatarImage
                                                src={
                                                    player.avatarUrl ||
                                                    getAvatarUrl(
                                                        getAvatarForName(
                                                            player.name,
                                                        ),
                                                    )
                                                }
                                                alt={player.name || 'Avatar'}
                                            />
                                            <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                                {player.name
                                                    ? getInitials(player.name)
                                                    : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            {player.userId ? (
                                                <div>
                                                    <p className="truncate font-medium text-foreground">
                                                        {player.name}
                                                    </p>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {player.email}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <Input
                                                        placeholder="Naam"
                                                        value={player.name}
                                                        data-testid={`player-name-${i}`}
                                                        onChange={(e) =>
                                                            updatePlayer(
                                                                player.id,
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8"
                                                    />
                                                    <Input
                                                        type="email"
                                                        placeholder="Email"
                                                        value={player.email}
                                                        data-testid={`player-email-${i}`}
                                                        onChange={(e) =>
                                                            updatePlayer(
                                                                player.id,
                                                                'email',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="h-8"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePlayer(player.id)
                                            }
                                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Available Users to Add */}
                            {availableUsers.length > 0 && (
                                <div>
                                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Search className="size-4" />
                                        Kies uit bestaande spelers
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {availableUsers
                                            .filter(
                                                (user) =>
                                                    !players.some(
                                                        (p) =>
                                                            p.email.toLowerCase() ===
                                                            user.email.toLowerCase(),
                                                    ),
                                            )
                                            .map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const emptySlot =
                                                            players.find(
                                                                (p) =>
                                                                    !p.name &&
                                                                    !p.email,
                                                            );
                                                        if (emptySlot) {
                                                            selectExistingUser(
                                                                emptySlot.id,
                                                                user,
                                                            );
                                                        } else if (
                                                            players.length < 8
                                                        ) {
                                                            setPlayers(
                                                                (prev) => [
                                                                    ...prev,
                                                                    {
                                                                        id: crypto.randomUUID(),
                                                                        name: user.name,
                                                                        email: user.email,
                                                                        userId: user.id,
                                                                        avatarUrl:
                                                                            user.avatar_url,
                                                                    },
                                                                ],
                                                            );
                                                        }
                                                    }}
                                                    disabled={players.length >= 8}
                                                    className="flex items-center gap-2 rounded-lg border bg-background p-2 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Avatar className="size-8 shrink-0 border border-border">
                                                        <AvatarImage
                                                            src={
                                                                user.avatar_url ||
                                                                undefined
                                                            }
                                                            alt={user.name}
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                                            {getInitials(
                                                                user.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">
                                                            {user.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {errors.players && (
                                <p className="mt-2 text-sm text-destructive">
                                    {errors.players}
                                </p>
                            )}
                        </section>

                        {/* Submit */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1"
                                size="lg"
                            >
                                {isSubmitting ? 'Aanmaken...' : 'Spel Aanmaken'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/admin')}
                                size="lg"
                            >
                                Annuleren
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
