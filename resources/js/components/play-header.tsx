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
        <header className="flex items-center justify-between border-b border-border px-4 py-3 pt-[var(--safe-top)]">
            {leftContent ?? (
                <div className="flex flex-col">
                    <span className="font-display text-lg font-bold text-foreground">
                        {title}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-muted-foreground">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
            <span
                data-testid={testId}
                className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary"
            >
                {points} punten
            </span>
        </header>
    );
}
