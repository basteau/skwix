import { X, Grid3x3, HelpCircle, Disc3, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TUTORIAL_SEEN_KEY = 'skwix_tutorial_seen';

interface TutorialModalProps {
    forceOpen?: boolean;
    onClose?: () => void;
}

interface TutorialStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    points?: string;
    example?: React.ReactNode;
}

const steps: TutorialStep[] = [
    {
        icon: <span className="text-4xl">❄️</span>,
        title: 'Welkom bij Skwix!',
        description:
            'Een spannend woordspel waar je elke dag puzzels oplost om punten te verdienen. Wie als eerste het mystery-woord raadt, wint!',
        example: (
            <div className="mt-4 rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-sm text-muted-foreground">Raad het geheime woord en win de prijs!</p>
            </div>
        ),
    },
    {
        icon: <Grid3x3 className="h-12 w-12 text-primary" />,
        title: 'Wordle',
        description:
            'Elke dag krijg je een 5-letter woord om te raden. Je hebt 6 pogingen. Groene letters zijn correct, gele letters zitten in het woord maar op de verkeerde plek.',
        points: '3-6 punten per dag',
        example: (
            <div className="mt-4 flex justify-center gap-1">
                {['W', 'I', 'N', 'T', 'R'].map((letter, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-md font-mono text-lg font-bold text-white',
                            i === 0 || i === 4 ? 'bg-green-500' : i === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                        )}
                    >
                        {letter}
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: <HelpCircle className="h-12 w-12 text-primary" />,
        title: 'Vragen Stellen',
        description:
            'Stel ja/nee vragen over het mystery-woord. Elke vraag kost 3 punten. Gebruik je vragen slim om het woord te raden!',
        points: '-3 punten per vraag',
        example: (
            <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm">"Is het een dier?"</p>
                    <p className="text-xs font-medium text-green-600">→ JA</p>
                </div>
            </div>
        ),
    },
    {
        icon: <Disc3 className="h-12 w-12 text-primary" />,
        title: 'Rad van Fortuin',
        description:
            'Waag een gokje met je punten! Zet in wat je durft en draai aan het rad. Je kunt je inzet verdubbelen... of verliezen!',
        points: 'Verdubbel of verlies je inzet',
        example: (
            <div className="mt-4 flex justify-center">
                <div className="relative h-20 w-20 rounded-full border-4 border-primary bg-gradient-to-br from-primary/20 to-primary/40">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🎰</span>
                    </div>
                </div>
            </div>
        ),
    },
    {
        icon: <Trophy className="h-12 w-12 text-amber-500" />,
        title: 'Winnen!',
        description:
            'Verzamel genoeg punten en raad het mystery-woord correct. De eerste die het woord raadt, wint de prijs!',
        example: (
            <div className="mt-4 rounded-lg bg-gradient-to-r from-amber-100 to-amber-50 p-4 text-center">
                <p className="text-lg font-bold text-amber-700">🏆 Jij bent de winnaar! 🏆</p>
            </div>
        ),
    },
];

export function TutorialModal({ forceOpen = false, onClose }: TutorialModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (forceOpen) {
            setIsOpen(true);
            setCurrentStep(0);
            return;
        }

        const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
        if (!seen) {
            setIsOpen(true);
        }
    }, [forceOpen]);

    const handleClose = useCallback(() => {
        localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
        setIsOpen(false);
        setCurrentStep(0);
        onClose?.();
    }, [onClose]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            handleClose();
        }
    }, [currentStep, handleClose]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((s) => s - 1);
        }
    }, [currentStep]);

    const handleSkip = useCallback(() => {
        handleClose();
    }, [handleClose]);

    if (!isOpen) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-card shadow-2xl">
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="p-6 pt-10 text-center">
                    {/* Icon */}
                    <div className="mb-4 flex justify-center">{step.icon}</div>

                    {/* Title */}
                    <h2 className="mb-3 text-xl font-bold text-foreground">{step.title}</h2>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                    {/* Points badge */}
                    {step.points && (
                        <div className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {step.points}
                        </div>
                    )}

                    {/* Example */}
                    {step.example}
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 pb-4">
                    {steps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentStep(i)}
                            className={cn(
                                'h-2 w-2 rounded-full transition-colors',
                                i === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                            )}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-border px-6 py-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Vorige
                    </Button>

                    <button
                        onClick={handleSkip}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Overslaan
                    </button>

                    <Button size="sm" onClick={handleNext} className="gap-1">
                        {isLastStep ? 'Starten!' : 'Volgende'}
                        {!isLastStep && <ChevronRight className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function useTutorial() {
    const [showTutorial, setShowTutorial] = useState(false);

    const openTutorial = useCallback(() => setShowTutorial(true), []);
    const closeTutorial = useCallback(() => setShowTutorial(false), []);

    return {
        showTutorial,
        openTutorial,
        closeTutorial,
        TutorialModal: showTutorial ? (
            <TutorialModal forceOpen onClose={closeTutorial} />
        ) : null,
    };
}
