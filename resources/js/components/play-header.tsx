import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface PlayHeaderProps {
    title: string;
    subtitle?: string;
    leftContent?: ReactNode;
    points: number;
    testId?: string;
}

export function PlayHeader({
    title,
    subtitle,
    leftContent,
    points,
    testId = 'points-header',
}: PlayHeaderProps) {
    return (
        <header className="flex items-center justify-between border-b border-border/80 bg-gradient-to-b from-card to-background px-4 py-3 pt-[calc(var(--safe-top)+0.75rem)]">
            {leftContent ?? (
                <div className="flex flex-col">
                    <span className="font-display text-xl font-bold tracking-tight text-foreground">
                        {title}
                    </span>
                    {subtitle && (
                        <span className="text-xs font-medium text-muted-foreground">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
            <div
                data-testid={testId}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/10 px-3.5 py-1.5 shadow-sm ring-1 ring-primary/20"
            >
                <Sparkles className="size-3.5 text-primary" />
                <span className="font-display text-sm font-bold tabular-nums text-primary">
                    {points}
                </span>
            </div>
        </header>
    );
}
