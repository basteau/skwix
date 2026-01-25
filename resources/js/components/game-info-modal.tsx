import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Snowflake, X } from 'lucide-react';
import type { ReactNode } from 'react';

const SNOWFLAKES = Array.from({ length: 6 }).map((_, i) => ({
    left: 10 + (i * 14) % 80,
    delay: i * 300,
    duration: 8 + (i % 3) * 2,
    size: 8 + (i % 3) * 3,
    opacity: 0.06 + (i % 3) * 0.02,
}));

export interface GameInfoContent {
    title: string;
    description: string;
    rules: { icon?: ReactNode; text: string }[];
    pointsInfo?: string;
}

interface GameInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: GameInfoContent;
}

export function GameInfoModal({ open, onOpenChange, content }: GameInfoModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[360px] gap-0 overflow-hidden rounded-2xl border-0 bg-gradient-to-b from-card via-card to-background p-0 shadow-2xl [&>button:last-child]:hidden"
                aria-describedby="game-info-description"
            >
                {/* Background frost effect */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {SNOWFLAKES.map((flake, i) => (
                        <div
                            key={i}
                            className="absolute animate-snow-fall"
                            style={{
                                left: `${flake.left}%`,
                                animationDelay: `${flake.delay}ms`,
                                animationDuration: `${flake.duration}s`,
                                opacity: flake.opacity,
                            }}
                        >
                            <Snowflake
                                className="text-primary"
                                style={{ width: flake.size, height: flake.size }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close button */}
                <DialogClose
                    className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                    aria-label="Sluiten"
                >
                    <X className="size-4" />
                </DialogClose>

                {/* Content */}
                <div className="relative px-6 pt-10 pb-4">
                    <DialogTitle className="font-display text-xl font-bold text-foreground">
                        {content.title}
                    </DialogTitle>

                    <DialogDescription
                        id="game-info-description"
                        className="mt-2 text-sm leading-relaxed text-muted-foreground"
                    >
                        {content.description}
                    </DialogDescription>

                    {/* Rules list */}
                    <ul className="mt-4 space-y-2.5">
                        {content.rules.map((rule, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2.5 text-sm text-foreground"
                            >
                                {rule.icon ? (
                                    <span className="mt-0.5 shrink-0">{rule.icon}</span>
                                ) : (
                                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                                )}
                                <span>{rule.text}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Points info */}
                    {content.pointsInfo && (
                        <div className="mt-4 rounded-lg bg-primary/10 px-3 py-2">
                            <p className="text-xs font-medium text-primary">
                                {content.pointsInfo}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative border-t border-border/50 bg-muted/30 px-5 py-4">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="w-full font-semibold"
                        data-testid="game-info-close"
                    >
                        Begrepen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Pre-defined content for each game
export const WORDLE_INFO: GameInfoContent = {
    title: 'Hoe werkt Wordle?',
    description: 'Raad het woord in 6 pogingen. Elke gok moet een geldig 5-letter woord zijn.',
    rules: [
        {
            icon: <span className="size-3 rounded-sm bg-wordle-correct" />,
            text: 'Groen = letter is correct en op juiste plek',
        },
        {
            icon: <span className="size-3 rounded-sm bg-wordle-present" />,
            text: 'Geel = letter zit in woord maar verkeerde plek',
        },
        {
            icon: <span className="size-3 rounded-sm bg-wordle-absent" />,
            text: 'Grijs = letter zit niet in woord',
        },
    ],
    pointsInfo: 'Punten: 6 bij 1 poging, aflopend tot 1 bij 6 pogingen',
};

export const FORTUNE_INFO: GameInfoContent = {
    title: 'Hoe werkt het Rad?',
    description: 'Draai aan het rad en verdubbel je inzet... of verlies alles!',
    rules: [
        { text: 'Kies je inzet (10, 25, 50, 100 of max)' },
        { text: 'Draai aan het rad' },
        {
            icon: <span className="size-3 rounded-sm bg-success" />,
            text: 'Groen segment = verdubbel je inzet',
        },
        {
            icon: <span className="size-3 rounded-sm bg-primary" />,
            text: 'Blauw segment = verlies je inzet',
        },
    ],
    pointsInfo: '50% winkans',
};

export const GUESS_INFO: GameInfoContent = {
    title: 'Hoe werkt Vragen?',
    description: 'Stel ja/nee vragen over het mystery woord of waag een gok!',
    rules: [
        { text: 'Stel ja/nee vragen over het mystery woord' },
        { text: 'Elke vraag kost 3 punten' },
        { text: 'Raad het woord correct = je wint het spel!' },
        { text: 'Alle spelers zien elkaars vragen' },
    ],
    pointsInfo: 'Tip: wees specifiek met je vragen',
};
