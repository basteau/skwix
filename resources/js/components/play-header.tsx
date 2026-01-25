import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router } from '@inertiajs/react';
import { LogOut, MoreVertical, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface PlayHeaderProps {
    title: string;
    subtitle?: string;
    leftContent?: ReactNode;
    rightAction?: ReactNode;
    points: number;
    testId?: string;
    showMenu?: boolean;
}

export function PlayHeader({
    title,
    subtitle,
    leftContent,
    rightAction,
    points,
    testId = 'points-header',
    showMenu = true,
}: PlayHeaderProps) {
    const handleLogout = () => {
        router.flushAll();
    };

    return (
        <header
            data-testid="play-header"
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border/80 bg-gradient-to-b from-card to-background px-4 py-3 pt-[calc(var(--safe-top)+0.75rem)]"
        >
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
            <div className="flex items-center gap-2">
                <div
                    data-testid={testId}
                    className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/10 px-3.5 py-1.5 shadow-sm ring-1 ring-primary/20"
                >
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="font-display text-sm font-bold tabular-nums text-primary">
                        {points}
                    </span>
                </div>
                {rightAction}
                {showMenu && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            data-testid="play-menu-trigger"
                        >
                            <MoreVertical className="size-5" />
                            <span className="sr-only">Menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    onClick={handleLogout}
                                    data-testid="logout-button"
                                    className="w-full cursor-pointer"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Afmelden
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
