import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
    status: 'pending' | 'active' | 'completed';
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
    const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-800',
        active: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
    };

    const statusLabels: Record<string, string> = {
        pending: 'Wachtend',
        active: 'Actief',
        completed: 'Voltooid',
    };

    const updateWordleWord = useCallback((index: number, value: string) => {
        setWordleWords((prev) => prev.map((w, i) => (i === index ? value.toLowerCase() : w)));
    }, []);

    const handleSaveWordleWords = useCallback(() => {
        setIsUpdatingWords(true);
        router.put(
            `/admin/game/${game.id}/wordle-words`,
            { wordle_words: wordleWords },
            {
                onFinish: () => setIsUpdatingWords(false),
            }
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
            }
        );
    }, [game.id, selectedWinnerId]);

    const startsAt = game.starts_at ? new Date(game.starts_at) : null;
    const endsAt = game.ends_at ? new Date(game.ends_at) : null;

    return (
        <>
            <Head title={`Spel: ${game.secret_word} - Admin`} />
            <div className="min-h-svh bg-background">
                <header className="border-b border-border bg-card px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                            ← Terug
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="font-mono text-2xl font-bold uppercase tracking-wider text-foreground">
                                {game.secret_word}
                            </h1>
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-1 text-xs font-medium',
                                    statusColors[game.status]
                                )}
                            >
                                {statusLabels[game.status]}
                            </span>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl p-6">
                    <div className="space-y-8">
                        {/* Game Info */}
                        <section className="rounded-lg border border-border bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold text-foreground">Spel Info</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <span className="text-sm text-muted-foreground">Geheim Woord</span>
                                    <p className="font-mono text-lg font-semibold uppercase">
                                        {game.secret_word}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Aantal Spelers</span>
                                    <p className="text-lg font-semibold">{players.length}</p>
                                </div>
                                {startsAt && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">Start</span>
                                        <p className="font-medium">
                                            {startsAt.toLocaleDateString('nl-BE', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                )}
                                {endsAt && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">Einde</span>
                                        <p className="font-medium">
                                            {endsAt.toLocaleDateString('nl-BE', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                )}
                                {game.winner && (
                                    <div className="sm:col-span-2">
                                        <span className="text-sm text-muted-foreground">Winnaar</span>
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
                            <div className="grid gap-2 sm:grid-cols-3">
                                {wordleWords.map((word, i) => (
                                    <div key={i}>
                                        <label className="mb-1 block text-xs text-muted-foreground">
                                            Dag {i + 1}
                                        </label>
                                        <Input
                                            value={word}
                                            onChange={(e) => updateWordleWord(i, e.target.value)}
                                            maxLength={5}
                                            className="font-mono uppercase"
                                            disabled={game.status === 'completed'}
                                        />
                                    </div>
                                ))}
                            </div>
                            {game.status !== 'completed' && (
                                <Button
                                    onClick={handleSaveWordleWords}
                                    disabled={isUpdatingWords}
                                    className="mt-4"
                                >
                                    {isUpdatingWords ? 'Opslaan...' : 'Woorden Opslaan'}
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
                                            'flex items-center justify-between rounded-lg border p-4',
                                            index === 0 && 'border-amber-200 bg-amber-50',
                                            index === 1 && 'border-gray-200 bg-gray-50',
                                            index === 2 && 'border-orange-200 bg-orange-50',
                                            index > 2 && 'border-border bg-background'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {player.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {player.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.points}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Punten</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.wordle_completed}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Wordles</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.questions_asked}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Vragen</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">
                                                    {player.spins_count}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Spins</p>
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {player.invite_code}
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
                                    Beëindig het spel handmatig. Selecteer optioneel een winnaar.
                                </p>
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-medium">
                                        Winnaar selecteren (optioneel)
                                    </label>
                                    <select
                                        value={selectedWinnerId ?? ''}
                                        onChange={(e) =>
                                            setSelectedWinnerId(
                                                e.target.value ? parseInt(e.target.value, 10) : null
                                            )
                                        }
                                        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                                    >
                                        <option value="">Geen winnaar</option>
                                        {players.map((player) => (
                                            <option key={player.id} value={player.id}>
                                                {player.name} ({player.points} punten)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleEndGame}
                                    disabled={isEndingGame}
                                >
                                    {isEndingGame ? 'Beëindigen...' : 'Spel Beëindigen'}
                                </Button>
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
