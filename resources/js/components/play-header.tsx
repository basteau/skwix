import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router } from '@inertiajs/react';
import {
    FlaskConical,
    LogOut,
    MoreVertical,
    RotateCcw,
    Sparkles,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface PlayHeaderProps {
    title: string;
    subtitle?: string;
    leftContent?: ReactNode;
    rightAction?: ReactNode;
    points: number;
    testId?: string;
    showMenu?: boolean;
    testMode?: boolean;
    onTestReset?: () => void;
}

export function PlayHeader({
    title,
    subtitle,
    leftContent,
    rightAction,
    points,
    testId = 'points-header',
    showMenu = true,
    testMode = false,
    onTestReset,
}: PlayHeaderProps) {
    const handleLogout = () => {
        router.flushAll();
    };

    const handleTestReset = () => {
        onTestReset?.();
        router.post('/test/reset');
    };

    const handleTestExit = () => {
        router.post('/test/exit');
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
                {testMode && (
                    <div
                        data-testid="test-mode-indicator"
                        className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-1 ring-1 ring-warning/30"
                    >
                        <FlaskConical className="size-3 text-warning" />
                        <span className="text-[10px] font-semibold text-warning uppercase">
                            Test
                        </span>
                    </div>
                )}
                <div
                    data-testid={testId}
                    className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/10 px-3.5 py-1.5 shadow-sm ring-1 ring-primary/20"
                >
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="font-display text-sm font-bold text-primary tabular-nums">
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
                            {testMode && (
                                <>
                                    <DropdownMenuItem
                                        onClick={handleTestReset}
                                        data-testid="test-reset-button"
                                        className="cursor-pointer text-warning"
                                    >
                                        <RotateCcw className="mr-2 size-4" />
                                        Reset Test
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleTestExit}
                                        data-testid="test-exit-button"
                                        className="cursor-pointer text-warning"
                                    >
                                        <X className="mr-2 size-4" />
                                        Stop Test
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
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
