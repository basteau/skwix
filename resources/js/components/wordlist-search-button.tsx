import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface WordlistSearchButtonProps {
    onClick: () => void;
    className?: string;
    hasActiveFilters?: boolean;
}

export function WordlistSearchButton({
    onClick,
    className,
    hasActiveFilters,
}: WordlistSearchButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Doorzoek woordenlijst"
            data-testid="wordlist-search-button"
            className={cn(
                'relative flex size-11 items-center justify-center rounded-full',
                'text-muted-foreground/60 hover:text-primary hover:bg-primary/10',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                className,
            )}
        >
            <BookOpen className="size-5" />
            {hasActiveFilters && (
                <span className="absolute top-1.5 right-1.5 flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                </span>
            )}
        </button>
    );
}
