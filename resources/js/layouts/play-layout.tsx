import type { PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';
import { BottomTabNav } from '@/components/bottom-tab-nav';
import { TutorialModal } from '@/components/tutorial-modal';

interface PlayLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function PlayLayout({ children }: PlayLayoutProps) {
    const [forceOpen, setForceOpen] = useState(false);

    const openTutorial = useCallback(() => setForceOpen(true), []);
    const closeTutorial = useCallback(() => setForceOpen(false), []);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main
                className="flex-1 pb-[calc(64px+var(--safe-bottom))]"
            >
                {children}
            </main>
            <BottomTabNav onTutorialClick={openTutorial} />
            <TutorialModal forceOpen={forceOpen} onClose={closeTutorial} />
        </div>
    );
}
