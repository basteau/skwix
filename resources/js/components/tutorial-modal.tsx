import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
    emoji: string;
    title: string;
    description: string;
    points?: string;
    example?: React.ReactNode;
}

const steps: TutorialStep[] = [
    {
        emoji: '❄️',
        title: 'Welkom bij Skwix!',
        description:
            'Een spannend woordspel waar je elke dag puzzels oplost om punten te verdienen. Wie als eerste het mystery-woord raadt, wint!',
        example: (
            <div className="mt-6 border-l-2 border-primary pl-4">
                <p className="text-sm text-foreground/80">Raad het geheime woord en win de prijs!</p>
            </div>
        ),
    },
    {
        emoji: '🔤',
        title: 'Wordle',
        description:
            'Elke dag krijg je een 5-letter woord om te raden. Je hebt 6 pogingen.',
        points: '3–6 punten per dag',
        example: (
            <div className="mt-6 space-y-3">
                <div className="flex gap-1.5">
                    {['W', 'I', 'N', 'T', 'R'].map((letter, i) => {
                        const isCorrect = i === 0 || i === 4;
                        const isPresent = i === 2;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    'relative flex size-9 items-center justify-center rounded font-mono text-base font-bold text-white',
                                    isCorrect ? 'bg-wordle-correct' : isPresent ? 'bg-wordle-present' : 'bg-wordle-absent'
                                )}
                            >
                                {letter}
                                {isCorrect && (
                                    <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-white/60" />
                                )}
                                {isPresent && (
                                    <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-white/60" />
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-muted-foreground">
                    <span className="text-wordle-correct">■</span> correct &nbsp;
                    <span className="text-wordle-present">■</span> verkeerde plek &nbsp;
                    <span className="text-wordle-absent">■</span> niet in woord
                </p>
            </div>
        ),
    },
    {
        emoji: '❓',
        title: 'Vragen Stellen',
        description:
            'Stel ja/nee vragen over het mystery-woord. Gebruik je vragen slim om het woord te raden!',
        points: '−3 punten per vraag',
        example: (
            <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                    <p className="text-sm text-foreground">"Is het een dier?"</p>
                    <span className="rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">JA</span>
                </div>
                <div className="flex items-baseline justify-between">
                    <p className="text-sm text-foreground">"Leeft het in water?"</p>
                    <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">NEE</span>
                </div>
            </div>
        ),
    },
    {
        emoji: '🎰',
        title: 'Rad van Fortuin',
        description:
            'Waag een gokje met je punten! Zet in wat je durft en draai aan het rad. Je kunt je inzet verdubbelen... of verliezen!',
        points: 'Verdubbel of verlies je inzet',
        example: (
            <div className="mt-6 flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-primary bg-primary/5">
                    <span className="text-xl">🎡</span>
                </div>
                <div className="text-sm">
                    <p className="font-medium text-foreground">50% kans</p>
                    <p className="text-muted-foreground">Durf jij het aan?</p>
                </div>
            </div>
        ),
    },
    {
        emoji: '🏆',
        title: 'Winnen!',
        description:
            'Verzamel punten en raad het mystery-woord. De eerste die het woord raadt, wint de prijs!',
        example: (
            <div className="mt-6 rounded-lg border-2 border-success/30 bg-success/5 px-4 py-3">
                <p className="font-display text-lg font-bold text-success">Jij bent de winnaar!</p>
                <p className="mt-1 text-sm text-muted-foreground">Scan de QR-code om je prijs te claimen.</p>
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
                className="max-w-sm gap-0 overflow-hidden rounded-xl border-border p-0 shadow-xl [&>button:last-child]:hidden"
                aria-describedby="tutorial-step-description"
            >
                {/* Close button */}
                <DialogClose
                    className="absolute right-2 top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Sluiten"
                >
                    <X className="size-5" />
                </DialogClose>

                {/* Content - left aligned */}
                <div className="bg-card px-5 pb-2 pt-8">
                    {/* Step indicator - top left */}
                    <div className="mb-4 text-xs font-medium tracking-wide text-muted-foreground">
                        {currentStep + 1} / {steps.length}
                    </div>

                    {/* Title with inline emoji */}
                    <DialogTitle className="mb-2 font-display text-xl font-bold text-foreground">
                        <span className="mr-2">{step.emoji}</span>
                        {step.title}
                    </DialogTitle>

                    {/* Description */}
                    <DialogDescription
                        id="tutorial-step-description"
                        className="text-sm leading-relaxed text-muted-foreground"
                    >
                        {step.description}
                    </DialogDescription>

                    {/* Points badge - inline */}
                    {step.points && (
                        <p className="mt-2 text-sm font-medium text-primary">
                            {step.points}
                        </p>
                    )}

                    {/* Example */}
                    {step.example}
                </div>

                {/* Navigation footer */}
                <div className="flex items-center justify-between bg-card px-5 pb-5 pt-6">
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

                    {/* Progress dots */}
                    <div className="flex gap-0">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentStep(i)}
                                className="relative flex min-h-11 min-w-6 items-center justify-center"
                                aria-label={`Stap ${i + 1} van ${steps.length}`}
                                aria-current={i === currentStep ? 'step' : undefined}
                            >
                                <span
                                    className={cn(
                                        'h-1.5 w-1.5 rounded-full transition-all',
                                        i === currentStep ? 'w-4 bg-primary' : 'bg-muted-foreground/40'
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    <Button size="sm" onClick={handleNext} className="gap-1">
                        {isLastStep ? 'Start!' : 'Volgende'}
                        {!isLastStep && <ChevronRight className="size-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
