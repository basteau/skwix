import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { WordlistSheet } from '@/components/wordlist-sheet';

import { RefreshCw, Snowflake, Timer, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const SNOWFLAKES = Array.from({ length: 6 }).map((_, i) => ({
    left: 10 + ((i * 14) % 80),
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
    footer?: ReactNode;
}

interface GameInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: GameInfoContent;
}

export function GameInfoModal({
    open,
    onOpenChange,
    content,
}: GameInfoModalProps) {
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
                            className="animate-snow-fall absolute"
                            style={{
                                left: `${flake.left}%`,
                                animationDelay: `${flake.delay}ms`,
                                animationDuration: `${flake.duration}s`,
                                opacity: flake.opacity,
                            }}
                        >
                            <Snowflake
                                className="text-primary"
                                style={{
                                    width: flake.size,
                                    height: flake.size,
                                }}
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
                                    <span className="mt-0.5 shrink-0">
                                        {rule.icon}
                                    </span>
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

                    {/* Optional footer content */}
                    {content.footer}
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
    title: 'Wordle',
    description: 'Raad het 5-letterige Engelse woord in 6 pogingen.',
    rules: [
        {
            icon: <span className="size-3 rounded-sm bg-wordle-correct" />,
            text: 'Groen = juiste letter, juiste plek',
        },
        {
            icon: <span className="size-3 rounded-sm bg-wordle-present" />,
            text: 'Geel = juiste letter, verkeerde plek',
        },
        {
            icon: <span className="size-3 rounded-sm bg-wordle-absent" />,
            text: 'Grijs = letter zit niet in woord',
        },
    ],
    pointsInfo: '7–20 punten (minder pogingen = meer punten)',
    footer: <WordlistFooter />,
};

function WordlistFooter() {
    const [showWordlist, setShowWordlist] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setShowWordlist(true)}
                className="mt-4 text-[10px] text-muted-foreground/60 underline decoration-muted-foreground/30 underline-offset-2 transition-colors hover:text-muted-foreground hover:decoration-muted-foreground/50"
            >
                Doorzoek volledige woordlijst
            </button>
            <WordlistSheet open={showWordlist} onOpenChange={setShowWordlist} />
        </>
    );
}

export const FORTUNE_INFO: GameInfoContent = {
    title: 'Rad van Fortuin',
    description: 'Zet punten in en draai. Win het dubbele of verlies alles!',
    rules: [
        { text: 'Kies je inzet en draai' },
        {
            icon: <span className="size-3 rounded-sm bg-success" />,
            text: 'Groen = ×2 winst',
        },
        {
            icon: <span className="size-3 rounded-sm bg-primary" />,
            text: 'Blauw = inzet kwijt',
        },
    ],
    pointsInfo: '50% winkans',
};

export const GUESS_INFO: GameInfoContent = {
    title: 'Vragen Stellen',
    description: 'Stel ja/nee vragen om het geheime woord te raden.',
    rules: [
        { text: 'Elke vraag kost 10 punten' },
        {
            icon: <Timer className="size-3.5 text-muted-foreground" />,
            text: '8 uur cooldown na elke vraag',
        },
        { text: 'Raad correct = win de hoofdprijs!' },
        {
            icon: <RefreshCw className="size-3.5 text-muted-foreground" />,
            text: 'Regenereer een antwoord via het icoon (max 1x per 5 min)',
        },
        { text: 'Pas op: sabotage draait je antwoord om (ja↔nee)' },
    ],
    pointsInfo:
        'Tip: check de Spelers tab om te saboteren of sabotages te onthullen.',
};
