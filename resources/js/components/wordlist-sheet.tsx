import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown, Filter, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface WordlistSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MAX_DISPLAYED_WORDS = 100;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function WordlistSheet({ open, onOpenChange }: WordlistSheetProps) {
    const [words, setWords] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [mustContain, setMustContain] = useState<Set<string>>(new Set());
    const [mustNotContain, setMustNotContain] = useState<Set<string>>(new Set());
    const [filtersOpen, setFiltersOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const hasActiveFilters = mustContain.size > 0 || mustNotContain.size > 0;

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
            setMustContain(new Set());
            setMustNotContain(new Set());
            setFiltersOpen(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const toggleMustContain = (letter: string) => {
        if (mustContain.has(letter)) {
            setMustContain((prev) => {
                const next = new Set(prev);
                next.delete(letter);
                return next;
            });
        } else {
            setMustContain((prev) => new Set(prev).add(letter));
            setMustNotContain((prev) => {
                const next = new Set(prev);
                next.delete(letter);
                return next;
            });
        }
    };

    const toggleMustNotContain = (letter: string) => {
        if (mustNotContain.has(letter)) {
            setMustNotContain((prev) => {
                const next = new Set(prev);
                next.delete(letter);
                return next;
            });
        } else {
            setMustNotContain((prev) => new Set(prev).add(letter));
            setMustContain((prev) => {
                const next = new Set(prev);
                next.delete(letter);
                return next;
            });
        }
    };

    const clearFilters = () => {
        setMustContain(new Set());
        setMustNotContain(new Set());
    };

    const { filteredWords, totalMatches } = useMemo(() => {
        let filtered = words;

        // Apply text search
        if (search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter((word) => word.includes(searchLower));
        }

        // Apply mustContain filter - convert Set to Array once
        if (mustContain.size > 0) {
            const containLetters = [...mustContain];
            filtered = filtered.filter((word) =>
                containLetters.every((letter) => word.includes(letter)),
            );
        }

        // Apply mustNotContain filter - convert Set to Array once
        if (mustNotContain.size > 0) {
            const excludeLetters = [...mustNotContain];
            filtered = filtered.filter((word) =>
                excludeLetters.every((letter) => !word.includes(letter)),
            );
        }

        return {
            filteredWords: filtered.slice(0, MAX_DISPLAYED_WORDS),
            totalMatches: filtered.length,
        };
    }, [words, search, mustContain, mustNotContain]);

    const clearSearch = () => {
        setSearch('');
        inputRef.current?.focus();
    };

    const hasAnyFilter = search.trim() || hasActiveFilters;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="flex h-[85vh] max-h-[700px] flex-col rounded-t-2xl px-0 pb-0"
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

                <div className="shrink-0 space-y-3 px-5 py-3">
                    {/* Search input */}
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

                    {/* Letter filters */}
                    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                                    'hover:bg-muted/80',
                                    filtersOpen || hasActiveFilters
                                        ? 'bg-muted'
                                        : 'bg-muted/50',
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Filter className="size-4 text-muted-foreground" />
                                    <span className="font-medium">
                                        Letter filters
                                    </span>
                                    {hasActiveFilters && (
                                        <span className="flex items-center gap-1">
                                            {mustContain.size > 0 && (
                                                <span className="inline-flex items-center rounded bg-wordle-correct/20 px-1.5 py-0.5 text-xs font-medium text-wordle-correct">
                                                    +{mustContain.size}
                                                </span>
                                            )}
                                            {mustNotContain.size > 0 && (
                                                <span className="inline-flex items-center rounded bg-wordle-absent/20 px-1.5 py-0.5 text-xs font-medium text-wordle-absent">
                                                    -{mustNotContain.size}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'size-4 text-muted-foreground transition-transform duration-200',
                                        filtersOpen && 'rotate-180',
                                    )}
                                />
                            </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                            <div className="space-y-4 pt-3">
                                {/* Must contain */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Bevat{' '}
                                            <span className="text-wordle-correct">
                                                (groen)
                                            </span>
                                        </label>
                                        {mustContain.size > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {[...mustContain]
                                                    .sort()
                                                    .join(', ')
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <LetterGrid
                                        selected={mustContain}
                                        onToggle={toggleMustContain}
                                        variant="contain"
                                        disabled={mustNotContain}
                                    />
                                </div>

                                {/* Must not contain */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Bevat niet{' '}
                                            <span className="text-wordle-absent">
                                                (grijs)
                                            </span>
                                        </label>
                                        {mustNotContain.size > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {[...mustNotContain]
                                                    .sort()
                                                    .join(', ')
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <LetterGrid
                                        selected={mustNotContain}
                                        onToggle={toggleMustNotContain}
                                        variant="exclude"
                                        disabled={mustContain}
                                    />
                                </div>

                                {/* Clear filters button */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="w-full"
                                    >
                                        <X className="mr-1.5 size-3.5" />
                                        Filters wissen
                                    </Button>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Results count */}
                    {!isLoading && words.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {hasAnyFilter ? (
                                <>
                                    <span className="font-medium text-foreground">
                                        {totalMatches.toLocaleString('nl-NL')}
                                    </span>{' '}
                                    {totalMatches === 1
                                        ? 'resultaat'
                                        : 'resultaten'}
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
                            <p className="text-sm text-muted-foreground">
                                {error}
                            </p>
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
                                Geen woorden gevonden
                                {hasAnyFilter && ' met deze filters'}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Filters wissen
                                </button>
                            )}
                        </div>
                    )}

                    {!isLoading && !error && filteredWords.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {filteredWords.map((word) => (
                                <WordItem
                                    key={word}
                                    word={word}
                                    highlight={search}
                                    mustContain={mustContain}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

interface LetterGridProps {
    selected: Set<string>;
    onToggle: (letter: string) => void;
    variant: 'contain' | 'exclude';
    disabled: Set<string>;
}

function LetterGrid({ selected, onToggle, variant, disabled }: LetterGridProps) {
    return (
        <div className="flex flex-wrap gap-1">
            {ALPHABET.map((letter) => {
                const isSelected = selected.has(letter);
                const isDisabled = disabled.has(letter);

                return (
                    <button
                        key={letter}
                        type="button"
                        onClick={() => onToggle(letter)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        aria-label={`${letter.toUpperCase()}${isSelected ? (variant === 'contain' ? ' (bevat)' : ' (bevat niet)') : ''}`}
                        className={cn(
                            'flex size-8 items-center justify-center rounded-md text-sm font-semibold uppercase transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                            isDisabled && 'cursor-not-allowed opacity-30',
                            !isSelected &&
                                !isDisabled &&
                                'bg-card border border-border/50 text-foreground/70 hover:border-border hover:bg-muted',
                            isSelected &&
                                variant === 'contain' &&
                                'bg-wordle-correct text-white shadow-sm shadow-wordle-correct/30',
                            isSelected &&
                                variant === 'exclude' &&
                                'bg-wordle-absent text-white shadow-sm',
                        )}
                    >
                        {letter}
                    </button>
                );
            })}
        </div>
    );
}

interface WordItemProps {
    word: string;
    highlight: string;
    mustContain: Set<string>;
}

function WordItem({ word, highlight, mustContain }: WordItemProps) {
    const highlightedWord = useMemo(() => {
        const searchLower = highlight.toLowerCase().trim();
        const matchIndex = searchLower ? word.indexOf(searchLower) : -1;

        return word.split('').map((char, i) => {
            const isContainMatch = mustContain.has(char);
            const inSearchRange =
                matchIndex !== -1 &&
                i >= matchIndex &&
                i < matchIndex + searchLower.length;

            return (
                <span
                    key={i}
                    className={cn(
                        isContainMatch && 'text-wordle-correct font-bold',
                        inSearchRange &&
                            !isContainMatch &&
                            'bg-primary/20 text-primary font-semibold',
                    )}
                >
                    {char}
                </span>
            );
        });
    }, [word, highlight, mustContain]);

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
