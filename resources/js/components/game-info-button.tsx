import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface GameInfoButtonProps {
    onClick: () => void;
    className?: string;
}

export function GameInfoButton({ onClick, className }: GameInfoButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Speluitleg"
            data-testid="game-info-button"
            className={cn(
                'flex size-11 items-center justify-center rounded-full',
                'text-muted-foreground/50 hover:text-muted-foreground',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                className,
            )}
        >
            <Info className="size-5" />
        </button>
    );
}
