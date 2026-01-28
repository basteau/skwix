import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { BookOpen, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface WordlistSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MAX_DISPLAYED_WORDS = 100;

export function WordlistSheet({ open, onOpenChange }: WordlistSheetProps) {
    const [words, setWords] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchWordlist = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/woordenlijst.txt');
            if (!response.ok) {
                throw new Error('Kon woordenlijst niet laden');
            }
            const text = await response.text();
            const wordList = text
                .split('\n')
                .map((w) => w.trim().toLowerCase())
                .filter((w) => w.length === 5);
            setWords(wordList);
        } catch {
            setError('Kon woordenlijst niet laden. Probeer opnieuw.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open && words.length === 0 && !isLoading) {
            fetchWordlist();
        }
    }, [open, words.length, isLoading, fetchWordlist]);

    useEffect(() => {
        if (open) {
            setSearch('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const filteredWords = useMemo(() => {
        if (!search.trim()) {
            return words.slice(0, MAX_DISPLAYED_WORDS);
        }

        const searchLower = search.toLowerCase().trim();
        const filtered = words.filter((word) => word.includes(searchLower));
        return filtered.slice(0, MAX_DISPLAYED_WORDS);
    }, [words, search]);

    const totalMatches = useMemo(() => {
        if (!search.trim()) {
            return words.length;
        }
        const searchLower = search.toLowerCase().trim();
        return words.filter((word) => word.includes(searchLower)).length;
    }, [words, search]);

    const clearSearch = () => {
        setSearch('');
        inputRef.current?.focus();
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="flex h-[85vh] max-h-[600px] flex-col rounded-t-2xl px-0 pb-0"
            >
                <SheetHeader className="shrink-0 border-b border-border/50 px-5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                            <BookOpen className="size-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="font-display text-lg">
                                Woordenlijst
                            </SheetTitle>
                            <SheetDescription className="text-xs">
                                {words.length > 0
                                    ? `${words.length.toLocaleString('nl-NL')} woorden`
                                    : 'Wordle woorden (5 letters)'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="shrink-0 px-5 py-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Zoek woorden..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 pl-10 pr-10"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {!isLoading && words.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {search ? (
                                <>
                                    <span className="font-medium text-foreground">
                                        {totalMatches.toLocaleString('nl-NL')}
                                    </span>{' '}
                                    {totalMatches === 1 ? 'resultaat' : 'resultaten'}
                                    {totalMatches > MAX_DISPLAYED_WORDS && (
                                        <span className="text-muted-foreground/70">
                                            {' '}
                                            (eerste {MAX_DISPLAYED_WORDS} getoond)
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    Eerste {MAX_DISPLAYED_WORDS} van{' '}
                                    {words.length.toLocaleString('nl-NL')} woorden
                                </>
                            )}
                        </p>
                    )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1rem+var(--safe-bottom))]">
                    {isLoading && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-9 animate-pulse rounded-lg bg-muted"
                                    style={{
                                        animationDelay: `${i * 50}ms`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <div className="rounded-full bg-destructive/10 p-3">
                                <X className="size-5 text-destructive" />
                            </div>
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <button
                                type="button"
                                onClick={fetchWordlist}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Opnieuw proberen
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && filteredWords.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <Search className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Geen woorden gevonden voor "{search}"
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && filteredWords.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {filteredWords.map((word) => (
                                <WordItem
                                    key={word}
                                    word={word}
                                    highlight={search}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function WordItem({ word, highlight }: { word: string; highlight: string }) {
    const highlightedWord = useMemo(() => {
        if (!highlight.trim()) {
            return <span>{word}</span>;
        }

        const searchLower = highlight.toLowerCase().trim();
        const index = word.indexOf(searchLower);

        if (index === -1) {
            return <span>{word}</span>;
        }

        return (
            <>
                {word.slice(0, index)}
                <span className="bg-primary/20 text-primary font-semibold">
                    {word.slice(index, index + searchLower.length)}
                </span>
                {word.slice(index + searchLower.length)}
            </>
        );
    }, [word, highlight]);

    return (
        <div
            className={cn(
                'flex h-9 items-center justify-center rounded-lg',
                'bg-card border border-border/50',
                'font-mono text-sm tracking-wider uppercase',
                'text-foreground/90',
            )}
        >
            {highlightedWord}
        </div>
    );
}
