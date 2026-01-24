import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Disc3, Grid3x3, HelpCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    { label: 'Wordle', href: '/wordle', icon: Grid3x3 },
    { label: 'Vraag', href: '/guess', icon: HelpCircle },
    { label: 'Rad', href: '/fortune', icon: Disc3 },
    { label: 'Spelers', href: '/players', icon: Users },
    { label: 'Uitleg', icon: BookOpen, onClick: onTutorialClick },
];

export function BottomTabNav({ onTutorialClick }: BottomTabNavProps) {
    const { url } = usePage();
    const tabs = createTabs(onTutorialClick);

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[var(--safe-bottom)]">
            <div className="flex h-16 items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = tab.href ? url.startsWith(tab.href) : false;
                    const Icon = tab.icon;

                    const baseClasses = cn(
                        'flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5',
                        'transition-all duration-150 active:scale-95'
                    );

                    const stateClasses = isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50';

                    if (tab.onClick) {
                        return (
                            <button
                                key={tab.label}
                                onClick={tab.onClick}
                                className={cn(baseClasses, 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}
                            >
                                <Icon className="size-5" />
                                <span className="text-[10px] font-medium leading-tight">
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
                        >
                            <div className={cn('transition-transform', isActive && 'scale-110')}>
                                <Icon className="size-5" />
                            </div>
                            <span className={cn(
                                'text-[10px] leading-tight',
                                isActive ? 'font-semibold' : 'font-medium'
                            )}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
