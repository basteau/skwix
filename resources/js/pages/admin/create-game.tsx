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
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WordValidation {
    valid: boolean;
    message: string;
    suggestions: string[];
    loading: boolean;
}

interface Props {
    sampleWords: string[];
}

interface PlayerRow {
    id: string;
    name: string;
    email: string;
}

export default function CreateGame({ sampleWords }: Props) {
    const [secretWord, setSecretWord] = useState('');
    const [startsAt, setStartsAt] = useState<Date | undefined>(
        getDefaultStartDate(),
    );
    const [durationDays, setDurationDays] = useState(6);
    const [wordleWords, setWordleWords] = useState<string[]>(
        sampleWords.slice(0, 6).map((w) => w.toLowerCase()),
    );
    const [wordValidations, setWordValidations] = useState<
        Record<number, WordValidation>
    >({});
    const validationTimers = useRef<Record<number, NodeJS.Timeout>>({});
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

    const refreshWordleWords = useCallback(async () => {
        try {
            const res = await fetch(
                `/admin/random-words?count=${durationDays}`,
            );
            const data = await res.json();
            setWordleWords(data.words.map((w: string) => w.toLowerCase()));
            setWordValidations({});
        } catch {
            // ignore
        }
    }, [durationDays]);

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

    useEffect(() => {
        const timers = validationTimers.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setErrors({});

        const emails = players.map((p) => p.email.toLowerCase().trim());
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
            duration_days: durationDays,
            wordle_words: wordleWords.slice(0, durationDays),
            players: players.map((p) => ({
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
    }, [secretWord, startsAt, durationDays, wordleWords, players]);

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
                                Planning
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
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
                            <div className="grid gap-3 sm:grid-cols-3">
                                {wordleWords
                                    .slice(0, durationDays)
                                    .map((word, i) => {
                                        const validation = wordValidations[i];
                                        const showStatus =
                                            word.length === 5 && validation;
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
                                                    validation.suggestions
                                                        .length > 0 && (
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
                                        <div className="flex items-start gap-4">
                                            <Avatar className="size-14 shrink-0 border-2 border-border">
                                                <AvatarImage
                                                    src={getAvatarUrl(
                                                        getAvatarForName(
                                                            player.name,
                                                        ),
                                                    )}
                                                    alt={
                                                        player.name || 'Avatar'
                                                    }
                                                />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {player.name
                                                        ? getInitials(
                                                              player.name,
                                                          )
                                                        : '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="grid gap-3 sm:grid-cols-2">
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
                                                    />
                                                </div>
                                            </div>
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
