import type { PropsWithChildren } from 'react';
import { BottomTabNav } from '@/components/bottom-tab-nav';
import { TutorialModal, useTutorial } from '@/components/tutorial-modal';

interface PlayLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function PlayLayout({ children }: PlayLayoutProps) {
    const { showTutorial, openTutorial, closeTutorial } = useTutorial();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <main
                className="flex-1"
                style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
            >
                {children}
            </main>
            <BottomTabNav onTutorialClick={openTutorial} />
            <TutorialModal />
            {showTutorial && <TutorialModal forceOpen onClose={closeTutorial} />}
        </div>
    );
}
