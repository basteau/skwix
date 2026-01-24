import { AdminHeader } from '@/components/admin-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

interface Props {
    sampleWords: string[];
}

interface PlayerRow {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
}

export default function CreateGame({ sampleWords }: Props) {
    const [secretWord, setSecretWord] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [durationDays, setDurationDays] = useState(6);
    const [wordleWords, setWordleWords] = useState<string[]>(
        sampleWords.slice(0, 6),
    );
    const [players, setPlayers] = useState<PlayerRow[]>([
        { id: crypto.randomUUID(), name: '', email: '', avatar_url: '' },
        { id: crypto.randomUUID(), name: '', email: '', avatar_url: '' },
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
                    avatar_url: '',
                },
            ];
        });
    }, []);

    const removePlayer = useCallback((id: string) => {
        setPlayers((prev) => {
            if (prev.length <= 2) return prev;
            return prev.filter((p) => p.id !== id);
        });
    }, []);

    const updatePlayer = useCallback(
        (id: string, field: keyof PlayerRow, value: string) => {
            setPlayers((prev) =>
                prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
            );
        },
        [],
    );

    const refreshWordleWords = useCallback(async () => {
        try {
            const res = await fetch(
                `/admin/random-words?count=${durationDays}`,
            );
            const data = await res.json();
            setWordleWords(data.words);
        } catch {
            // ignore
        }
    }, [durationDays]);

    const updateWordleWord = useCallback((index: number, value: string) => {
        setWordleWords((prev) =>
            prev.map((w, i) => (i === index ? value.toLowerCase() : w)),
        );
    }, []);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setErrors({});

        const payload = {
            secret_word: secretWord,
            starts_at: startsAt,
            duration_days: durationDays,
            wordle_words: wordleWords.slice(0, durationDays),
            players: players.map((p) => ({
                name: p.name,
                email: p.email,
                avatar_url: p.avatar_url || null,
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
    }, [secretWord, startsAt, durationDays, wordleWords, players]);

    return (
        <>
            <Head title="Nieuw Spel - Admin" />
            <div className="min-h-svh bg-background">
                <AdminHeader
                    title="Nieuw Spel Aanmaken"
                    backHref="/admin"
                    breadcrumbs={[{ label: 'Nieuw Spel' }]}
                />

                <main className="pb-safe mx-auto max-w-2xl p-6">
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
                                Planning
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        Start datum & tijd
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={startsAt}
                                        onChange={(e) =>
                                            setStartsAt(e.target.value)
                                        }
                                    />
                                    {errors.starts_at && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.starts_at}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        Duur (dagen)
                                    </label>
                                    <Select
                                        value={String(durationDays)}
                                        onValueChange={(value) =>
                                            setDurationDays(parseInt(value, 10))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="4">
                                                4 dagen
                                            </SelectItem>
                                            <SelectItem value="5">
                                                5 dagen
                                            </SelectItem>
                                            <SelectItem value="6">
                                                6 dagen
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* Wordle Words */}
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Wordle Woorden ({durationDays} nodig)
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refreshWordleWords}
                                >
                                    Shuffle
                                </Button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {wordleWords
                                    .slice(0, durationDays)
                                    .map((word, i) => (
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
                                            />
                                        </div>
                                    ))}
                            </div>
                            {errors.wordle_words && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.wordle_words}
                                </p>
                            )}
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
                                    + Speler
                                </Button>
                            </div>
                            <div className="divide-y divide-border">
                                {players.map((player, i) => (
                                    <div
                                        key={player.id}
                                        className="py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">
                                                Speler {i + 1}
                                            </span>
                                            {players.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removePlayer(player.id)
                                                    }
                                                    className="text-sm text-destructive hover:underline"
                                                >
                                                    Verwijder
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <Input
                                                placeholder="Naam"
                                                value={player.name}
                                                onChange={(e) =>
                                                    updatePlayer(
                                                        player.id,
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <Input
                                                type="email"
                                                placeholder="Email"
                                                value={player.email}
                                                onChange={(e) =>
                                                    updatePlayer(
                                                        player.id,
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <Input
                                                placeholder="Avatar URL (optioneel)"
                                                value={player.avatar_url}
                                                onChange={(e) =>
                                                    updatePlayer(
                                                        player.id,
                                                        'avatar_url',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.players && (
                                <p className="mt-1 text-sm text-destructive">
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
