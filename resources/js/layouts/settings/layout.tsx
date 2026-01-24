import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profiel',
        href: edit(),
        icon: null,
    },
    {
        title: 'Wachtwoord',
        href: editPassword(),
        icon: null,
    },
    {
        title: 'Tweestapsverificatie',
        href: show(),
        icon: null,
    },
    {
        title: 'Weergave',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6 lg:py-10">
            <Heading
                title="Instellingen"
                description="Beheer je profiel- en accountinstellingen"
            />

            <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:gap-12">
                <aside className="w-full shrink-0 lg:w-52">
                    <nav
                        className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentUrl(item.href);
                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'relative shrink-0 rounded-md px-3 py-2 text-sm transition-colors',
                                        active
                                            ? 'bg-primary/10 font-semibold text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    {active && (
                                        <span className="absolute left-0 top-1/2 hidden h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary lg:block" />
                                    )}
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1 lg:max-w-2xl">
                    <section className="space-y-8 lg:space-y-10">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
