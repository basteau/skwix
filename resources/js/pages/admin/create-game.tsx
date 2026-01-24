import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const [wordleWords, setWordleWords] = useState<string[]>(sampleWords.slice(0, 6));
    const [players, setPlayers] = useState<PlayerRow[]>([
        { id: crypto.randomUUID(), name: '', email: '', avatar_url: '' },
        { id: crypto.randomUUID(), name: '', email: '', avatar_url: '' },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addPlayer = useCallback(() => {
        if (players.length >= 8) return;
        setPlayers((prev) => [
            ...prev,
            { id: crypto.randomUUID(), name: '', email: '', avatar_url: '' },
        ]);
    }, [players.length]);

    const removePlayer = useCallback((id: string) => {
        if (players.length <= 2) return;
        setPlayers((prev) => prev.filter((p) => p.id !== id));
    }, [players.length]);

    const updatePlayer = useCallback((id: string, field: keyof PlayerRow, value: string) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
    }, []);

    const refreshWordleWords = useCallback(async () => {
        try {
            const res = await fetch(`/admin/random-words?count=${durationDays}`);
            const data = await res.json();
            setWordleWords(data.words);
        } catch {
            // ignore
        }
    }, [durationDays]);

    const updateWordleWord = useCallback((index: number, value: string) => {
        setWordleWords((prev) => prev.map((w, i) => (i === index ? value.toLowerCase() : w)));
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
                <header className="border-b border-border bg-card px-6 py-4">
                    <h1 className="text-2xl font-bold text-foreground">Nieuw Spel Aanmaken</h1>
                </header>

                <main className="mx-auto max-w-2xl p-6">
                    <div className="space-y-8">
                        {/* Secret Word */}
                        <section>
                            <h2 className="mb-3 text-lg font-semibold text-foreground">Mystery Woord</h2>
                            <Input
                                value={secretWord}
                                onChange={(e) => setSecretWord(e.target.value)}
                                placeholder="Het woord dat spelers moeten raden"
                                className="text-lg"
                            />
                            {errors.secret_word && (
                                <p className="mt-1 text-sm text-destructive">{errors.secret_word}</p>
                            )}
                        </section>

                        {/* Timing */}
                        <section>
                            <h2 className="mb-3 text-lg font-semibold text-foreground">Planning</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        Start datum & tijd
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={startsAt}
                                        onChange={(e) => setStartsAt(e.target.value)}
                                    />
                                    {errors.starts_at && (
                                        <p className="mt-1 text-sm text-destructive">{errors.starts_at}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">
                                        Duur (dagen)
                                    </label>
                                    <select
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                    >
                                        <option value={4}>4 dagen</option>
                                        <option value={5}>5 dagen</option>
                                        <option value={6}>6 dagen</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Wordle Words */}
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Wordle Woorden ({durationDays} nodig)
                                </h2>
                                <Button variant="outline" size="sm" onClick={refreshWordleWords}>
                                    Shuffle
                                </Button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {wordleWords.slice(0, durationDays).map((word, i) => (
                                    <div key={i}>
                                        <label className="mb-1 block text-xs text-muted-foreground">
                                            Dag {i + 1}
                                        </label>
                                        <Input
                                            value={word}
                                            onChange={(e) => updateWordleWord(i, e.target.value)}
                                            maxLength={5}
                                            className="font-mono uppercase"
                                        />
                                    </div>
                                ))}
                            </div>
                            {errors.wordle_words && (
                                <p className="mt-1 text-sm text-destructive">{errors.wordle_words}</p>
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
                            <div className="space-y-3">
                                {players.map((player, i) => (
                                    <div
                                        key={player.id}
                                        className="rounded-lg border border-border bg-card p-4"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                Speler {i + 1}
                                            </span>
                                            {players.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePlayer(player.id)}
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
                                                    updatePlayer(player.id, 'name', e.target.value)
                                                }
                                            />
                                            <Input
                                                type="email"
                                                placeholder="Email"
                                                value={player.email}
                                                onChange={(e) =>
                                                    updatePlayer(player.id, 'email', e.target.value)
                                                }
                                            />
                                            <Input
                                                placeholder="Avatar URL (optioneel)"
                                                value={player.avatar_url}
                                                onChange={(e) =>
                                                    updatePlayer(player.id, 'avatar_url', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.players && (
                                <p className="mt-1 text-sm text-destructive">{errors.players}</p>
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
