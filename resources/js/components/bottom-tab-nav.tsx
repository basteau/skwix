import { Link, usePage } from '@inertiajs/react';
import BookOpen from 'lucide-react/icons/book-open';
import Disc3 from 'lucide-react/icons/disc-3';
import Grid3x3 from 'lucide-react/icons/grid-3x3';
import HelpCircle from 'lucide-react/icons/help-circle';
import Users from 'lucide-react/icons/users';
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
    { label: 'Wordle', href: '/play/wordle', icon: Grid3x3 },
    { label: 'Vraag', href: '/play/guess', icon: HelpCircle },
    { label: 'Rad', href: '/play/fortune', icon: Disc3 },
    { label: 'Spelers', href: '/play/players', icon: Users },
    { label: 'Uitleg', icon: BookOpen, onClick: onTutorialClick },
];

export function BottomTabNav({ onTutorialClick }: BottomTabNavProps) {
    const { url } = usePage();
    const tabs = createTabs(onTutorialClick);

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex h-16 items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = tab.href ? url.startsWith(tab.href) : false;
                    const Icon = tab.icon;

                    if (tab.onClick) {
                        return (
                            <button
                                key={tab.label}
                                onClick={tab.onClick}
                                className={cn(
                                    'flex min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-2',
                                    'transition-colors duration-150',
                                    'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Icon className="h-6 w-6" />
                                <span className="text-[11px] font-medium leading-tight">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href!}
                            className={cn(
                                'flex min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 py-2',
                                'transition-colors duration-150',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="text-[11px] font-medium leading-tight">
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
