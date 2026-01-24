import { BottomTabNav } from '@/components/bottom-tab-nav';
import { TutorialModal } from '@/components/tutorial-modal';
import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';

interface PlayLayoutProps extends PropsWithChildren {
    title?: string;
    hideNav?: boolean;
}

export default function PlayLayout({ children, hideNav }: PlayLayoutProps) {
    const [forceOpen, setForceOpen] = useState(false);

    const openTutorial = useCallback(() => setForceOpen(true), []);
    const closeTutorial = useCallback(() => setForceOpen(false), []);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main
                className={cn(
                    'flex-1 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
                    !hideNav && 'pb-[calc(64px+var(--safe-bottom))]',
                )}
            >
                {children}
            </main>
            {!hideNav && (
                <>
                    <BottomTabNav onTutorialClick={openTutorial} />
                    <TutorialModal forceOpen={forceOpen} onClose={closeTutorial} />
                </>
            )}
        </div>
    );
}
