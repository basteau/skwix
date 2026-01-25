import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Disc3, Grid3x3, HelpCircle, Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TabItem {
    label: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
}

interface BottomTabNavProps {
    onTutorialClick?: () => void;
}

const createTabs = (onTutorialClick?: () => void): TabItem[] => [
    { label: 'Wordle', href: '/play/wordle', icon: Grid3x3 },
    { label: 'Vraag', href: '/play/guess', icon: HelpCircle },
    { label: 'Rad', href: '/play/fortune', icon: Disc3 },
    { label: 'Spelers', href: '/play/players', icon: Users },
    { label: 'Uitleg', icon: BookOpen, onClick: onTutorialClick },
];

export function BottomTabNav({ onTutorialClick }: BottomTabNavProps) {
    const { url } = usePage();
    const tabs = createTabs(onTutorialClick);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    useEffect(() => {
        const handleStart = (event: { detail: { visit: { url: URL } } }) => {
            const targetUrl = event.detail.visit.url.pathname;
            if (targetUrl.startsWith('/play/')) {
                setNavigatingTo(targetUrl);
            }
        };

        const handleFinish = () => {
            setNavigatingTo(null);
        };

        const removeStart = router.on('start', handleStart);
        const removeFinish = router.on('finish', handleFinish);

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    const isNavigating = navigatingTo !== null;

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[var(--safe-bottom)]">
            <div className="flex h-16 items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = tab.href
                        ? url.startsWith(tab.href)
                        : false;
                    const isLoading = tab.href && navigatingTo?.startsWith(tab.href);
                    const Icon = tab.icon;

                    const baseClasses = cn(
                        'flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5',
                        'transition-all duration-150',
                        !isNavigating && 'active:scale-95',
                    );

                    const stateClasses = isActive
                        ? 'bg-primary/10 text-primary'
                        : isNavigating && !isLoading
                          ? 'text-muted-foreground/50 pointer-events-none'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50';

                    if (tab.onClick) {
                        return (
                            <button
                                key={tab.label}
                                onClick={tab.onClick}
                                disabled={isNavigating}
                                className={cn(
                                    baseClasses,
                                    isNavigating
                                        ? 'text-muted-foreground/50 pointer-events-none'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                )}
                            >
                                <Icon className="size-5" />
                                <span className="text-[10px] leading-tight font-medium">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href!}
                            className={cn(baseClasses, stateClasses)}
                            aria-disabled={isNavigating}
                        >
                            <div
                                className={cn(
                                    'transition-transform',
                                    isActive && !isLoading && 'scale-110',
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : (
                                    <Icon className="size-5" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] leading-tight',
                                    isActive ? 'font-semibold' : 'font-medium',
                                )}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
