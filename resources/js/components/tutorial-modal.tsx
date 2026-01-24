import ChevronLeft from 'lucide-react/icons/chevron-left';
import ChevronRight from 'lucide-react/icons/chevron-right';
import Disc3 from 'lucide-react/icons/disc-3';
import Grid3x3 from 'lucide-react/icons/grid-3x3';
import HelpCircle from 'lucide-react/icons/help-circle';
import Trophy from 'lucide-react/icons/trophy';
import X from 'lucide-react/icons/x';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
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
        icon: <Grid3x3 className="size-12 text-primary" />,
        title: 'Wordle',
        description:
            'Elke dag krijg je een 5-letter woord om te raden. Je hebt 6 pogingen. Groene letters zijn correct, gele letters zitten in het woord maar op de verkeerde plek.',
        points: '3-6 punten per dag',
        example: (
            <div className="mt-4 flex justify-center gap-1">
                {['W', 'I', 'N', 'T', 'R'].map((letter, i) => {
                    const isCorrect = i === 0 || i === 4;
                    const isPresent = i === 2;
                    return (
                        <div
                            key={i}
                            className={cn(
                                'relative flex size-10 items-center justify-center rounded-md font-mono text-lg font-bold text-white',
                                isCorrect ? 'bg-wordle-correct' : isPresent ? 'bg-wordle-present' : 'bg-wordle-absent'
                            )}
                        >
                            {letter}
                            {/* Secondary indicator for color blindness */}
                            {isCorrect && (
                                <span className="absolute -bottom-0.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-white/60" />
                            )}
                            {isPresent && (
                                <span className="absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/60" />
                            )}
                        </div>
                    );
                })}
            </div>
        ),
    },
    {
        icon: <HelpCircle className="size-12 text-primary" />,
        title: 'Vragen Stellen',
        description:
            'Stel ja/nee vragen over het mystery-woord. Elke vraag kost 3 punten. Gebruik je vragen slim om het woord te raden!',
        points: '-3 punten per vraag',
        example: (
            <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm">"Is het een dier?"</p>
                    <p className="text-xs font-medium text-success">→ JA</p>
                </div>
            </div>
        ),
    },
    {
        icon: <Disc3 className="size-12 text-primary" />,
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
        icon: <Trophy className="size-12 text-warning" />,
        title: 'Winnen!',
        description:
            'Verzamel genoeg punten en raad het mystery-woord correct. De eerste die het woord raadt, wint de prijs!',
        example: (
            <div className="mt-4 rounded-lg bg-gradient-to-r from-success/20 to-success/10 p-4 text-center">
                <p className="text-lg font-bold text-success">🏆 Jij bent de winnaar! 🏆</p>
            </div>
        ),
    },
];

function getInitialOpenState(forceOpen: boolean): boolean {
    if (forceOpen) return true;
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(TUTORIAL_SEEN_KEY);
}

export function TutorialModal({ forceOpen = false, onClose }: TutorialModalProps) {
    const [internalOpen, setInternalOpen] = useState(() => getInitialOpenState(forceOpen));
    const [currentStep, setCurrentStep] = useState(0);

    const isOpen = forceOpen || internalOpen;

    const handleClose = useCallback(() => {
        localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
        setInternalOpen(false);
        setCurrentStep(0);
        onClose?.();
    }, [onClose]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                handleClose();
            }
        },
        [handleClose]
    );

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

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-md gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl [&>button:last-child]:hidden"
                aria-describedby="tutorial-step-description"
            >
                {/* Custom close button with 44px touch target */}
                <DialogClose
                    className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Sluiten"
                >
                    <X className="size-5" />
                </DialogClose>

                {/* Content */}
                <div className="bg-card p-6 pt-10 text-center">
                    {/* Icon */}
                    <div className="mb-4 flex justify-center">{step.icon}</div>

                    {/* Title */}
                    <DialogTitle className="mb-3 text-xl font-bold text-foreground">
                        {step.title}
                    </DialogTitle>

                    {/* Description */}
                    <DialogDescription
                        id="tutorial-step-description"
                        className="text-sm leading-relaxed text-muted-foreground"
                    >
                        {step.description}
                    </DialogDescription>

                    {/* Points badge */}
                    {step.points && (
                        <div className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {step.points}
                        </div>
                    )}

                    {/* Example */}
                    {step.example}
                </div>

                {/* Progress dots - expanded touch targets */}
                <div className="flex justify-center gap-0 bg-card pb-2">
                    {steps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentStep(i)}
                            className="relative min-h-11 min-w-11 flex items-center justify-center"
                            aria-label={`Stap ${i + 1} van ${steps.length}`}
                            aria-current={i === currentStep ? 'step' : undefined}
                        >
                            <span
                                className={cn(
                                    'h-2.5 w-2.5 rounded-full transition-colors',
                                    i === currentStep ? 'bg-primary' : 'bg-muted-foreground/50'
                                )}
                            />
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="gap-1"
                    >
                        <ChevronLeft className="size-4" />
                        Vorige
                    </Button>

                    <DialogClose asChild>
                        <button className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
                            Overslaan
                        </button>
                    </DialogClose>

                    <Button size="sm" onClick={handleNext} className="gap-1">
                        {isLastStep ? 'Starten!' : 'Volgende'}
                        {!isLastStep && <ChevronRight className="size-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
