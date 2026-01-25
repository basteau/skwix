import { BottomTabNav } from '@/components/bottom-tab-nav';
import { SkipLink } from '@/components/skip-link';
import { TutorialModal } from '@/components/tutorial-modal';
import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface PlayLayoutProps extends PropsWithChildren {
    title?: string;
    hideNav?: boolean;
}

export default function PlayLayout({ children, hideNav }: PlayLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SkipLink />
            <main
                id="main-content"
                tabIndex={-1}
                className={cn(
                    'flex-1 outline-none motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
                    !hideNav && 'pb-[calc(64px+var(--safe-bottom))]',
                )}
            >
                {children}
            </main>
            {!hideNav && (
                <nav aria-label="Hoofdnavigatie">
                    <BottomTabNav />
                    <TutorialModal />
                </nav>
            )}
        </div>
    );
}
