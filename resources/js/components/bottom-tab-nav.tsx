import { Link, usePage } from '@inertiajs/react';
import { Grid3x3, HelpCircle, Users, Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
    { label: 'Wordle', href: '/play/wordle', icon: Grid3x3 },
    { label: 'Vraag', href: '/play/guess', icon: HelpCircle },
    { label: 'Rad', href: '/play/fortune', icon: Disc3 },
    { label: 'Spelers', href: '/play/players', icon: Users },
];

export function BottomTabNav() {
    const { url } = usePage();

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex h-16 items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = url.startsWith(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
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
