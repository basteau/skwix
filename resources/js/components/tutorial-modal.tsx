import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Skull, Snowflake, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const TUTORIAL_SEEN_KEY = 'skwix_tutorial_seen';

interface TutorialModalProps {
    forceOpen?: boolean;
    onClose?: () => void;
}

interface TutorialStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    points?: { text: string; type: 'earn' | 'cost' | 'risk' };
    visual: React.ReactNode;
}

const SNOWFLAKES = Array.from({ length: 8 }).map((_, i) => ({
    left: 10 + ((i * 12) % 80),
    delay: i * 400,
    duration: 6 + (i % 3) * 2,
    size: 10 + (i % 3) * 4,
    opacity: 0.08 + (i % 4) * 0.03,
}));

const steps: TutorialStep[] = [
    {
        icon: <Snowflake className="size-5" />,
        title: 'Welkom bij Skwix!',
        description:
            'Los dagelijks puzzels op, spaar punten, en raad het geheime woord om te winnen!',
        visual: (
            <div className="relative flex items-center justify-center py-6">
                <div className="relative">
                    {/* Animated word reveal */}
                    <div className="flex gap-1">
                        {['S', 'K', 'I', 'B', 'I'].map((letter, i) => (
                            <div
                                key={i}
                                className="flex size-11 items-center justify-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-md"
                                style={{
                                    animationDelay: `${i * 100}ms`,
                                }}
                            >
                                {letter}
                            </div>
                        ))}
                    </div>
                    {/* Sparkle accents */}
                    <div className="absolute -top-2 -right-2 text-primary/60">
                        ✦
                    </div>
                    <div className="absolute -bottom-1 -left-2 text-primary/40">
                        ✧
                    </div>
                </div>
            </div>
        ),
    },
    {
        icon: (
            <svg viewBox="0 0 20 20" className="size-5 fill-current">
                <rect
                    x="1"
                    y="1"
                    width="5"
                    height="5"
                    rx="1"
                    className="fill-wordle-correct"
                />
                <rect
                    x="7.5"
                    y="1"
                    width="5"
                    height="5"
                    rx="1"
                    className="fill-wordle-present"
                />
                <rect
                    x="14"
                    y="1"
                    width="5"
                    height="5"
                    rx="1"
                    className="fill-wordle-absent"
                />
                <rect x="1" y="7.5" width="5" height="5" rx="1" />
                <rect x="7.5" y="7.5" width="5" height="5" rx="1" />
                <rect x="14" y="7.5" width="5" height="5" rx="1" />
                <rect x="1" y="14" width="5" height="5" rx="1" />
                <rect x="7.5" y="14" width="5" height="5" rx="1" />
                <rect x="14" y="14" width="5" height="5" rx="1" />
            </svg>
        ),
        title: 'Wordle',
        description:
            'Raad het 5-letter woord in 6 pogingen. Kleuren tonen hoe dichtbij je bent.',
        points: { text: '10–20 punten', type: 'earn' },
        visual: (
            <div className="space-y-3 py-4">
                {/* Mini wordle grid */}
                <div className="flex justify-center gap-1.5">
                    {[
                        { l: 'W', s: 'correct' },
                        { l: 'I', s: 'absent' },
                        { l: 'N', s: 'present' },
                        { l: 'T', s: 'absent' },
                        { l: 'R', s: 'correct' },
                    ].map(({ l, s }, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex size-10 items-center justify-center rounded-md font-mono text-sm font-bold text-white shadow-sm',
                                s === 'correct' && 'bg-wordle-correct',
                                s === 'present' && 'bg-wordle-present',
                                s === 'absent' && 'bg-wordle-absent',
                            )}
                        >
                            {l}
                        </div>
                    ))}
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-wordle-correct" />
                        Correct
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-wordle-present" />
                        Verkeerde plek
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-sm bg-wordle-absent" />
                        Niet in woord
                    </span>
                </div>
            </div>
        ),
    },
    {
        icon: (
            <svg viewBox="0 0 20 20" className="size-5 fill-current">
                <circle
                    cx="10"
                    cy="10"
                    r="8"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                />
                <text
                    x="10"
                    y="14"
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                >
                    ?
                </text>
            </svg>
        ),
        title: 'Vragen Stellen',
        description:
            'Stel ja/nee vragen om het geheime woord te achterhalen.',
        points: { text: '−10 punten per vraag', type: 'cost' },
        visual: (
            <div className="space-y-2.5 py-4">
                {/* Chat-style Q&A */}
                <div className="flex items-start gap-3">
                    <div className="flex-1 rounded-xl rounded-tl-sm bg-primary/10 px-3.5 py-2.5">
                        <p className="text-sm text-foreground">
                            "Is het een dier?"
                        </p>
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
                        JA
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="flex-1 rounded-xl rounded-tl-sm bg-primary/10 px-3.5 py-2.5">
                        <p className="text-sm text-foreground">
                            "Leeft het in water?"
                        </p>
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">
                        NEE
                    </div>
                </div>
            </div>
        ),
    },
    {
        icon: <Skull className="size-5" />,
        title: 'Sabotage',
        description:
            'Saboteer anderen via de Spelers tab. Hun volgende ja/nee antwoord wordt omgedraaid!',
        points: { text: '−10 punten', type: 'cost' },
        visual: (
            <div className="space-y-3 py-4">
                {/* Sabotage illustration */}
                <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                            <Skull className="size-5" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Saboteer
                        </span>
                    </div>
                    <svg
                        viewBox="0 0 24 24"
                        className="size-5 text-muted-foreground/50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                            <div className="flex size-10 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success line-through decoration-destructive decoration-2">
                                JA
                            </div>
                        </div>
                        <span className="text-xs text-destructive font-medium">
                            → NEE
                        </span>
                    </div>
                </div>
                {/* Reveal hint */}
                <p className="text-center text-xs text-muted-foreground">
                    Betaal 12 punten om te zien welke antwoorden gesaboteerd
                    zijn
                </p>
            </div>
        ),
    },
    {
        icon: (
            <svg viewBox="0 0 20 20" className="size-5">
                <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M10 2 L10 6 M10 14 L10 18 M2 10 L6 10 M14 10 L18 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <circle cx="10" cy="10" r="3" fill="currentColor" />
            </svg>
        ),
        title: 'Rad van Fortuin',
        description:
            'Zet punten in en draai. Win het dubbele of verlies alles!',
        points: { text: '×2 of ×0 (50% kans)', type: 'risk' },
        visual: (
            <div className="flex items-center justify-center py-4">
                {/* Mini wheel preview */}
                <div className="relative">
                    <svg viewBox="0 0 80 80" className="size-24">
                        <defs>
                            <linearGradient
                                id="mini-wheel-win"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="oklch(55% 0.18 145)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="oklch(50% 0.16 145)"
                                />
                            </linearGradient>
                            <linearGradient
                                id="mini-wheel-lose"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="oklch(50% 0.12 230)"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="oklch(40% 0.10 235)"
                                />
                            </linearGradient>
                        </defs>
                        {/* Segments */}
                        {Array.from({ length: 8 }).map((_, i) => {
                            const isWin = i % 2 === 0;
                            const angle = i * 45 - 90;
                            const rad = (angle * Math.PI) / 180;
                            const x1 = 40 + 35 * Math.cos(rad);
                            const y1 = 40 + 35 * Math.sin(rad);
                            const rad2 = ((angle + 45) * Math.PI) / 180;
                            const x2 = 40 + 35 * Math.cos(rad2);
                            const y2 = 40 + 35 * Math.sin(rad2);
                            return (
                                <path
                                    key={i}
                                    d={`M40,40 L${x1},${y1} A35,35 0 0,1 ${x2},${y2} Z`}
                                    fill={
                                        isWin
                                            ? 'url(#mini-wheel-win)'
                                            : 'url(#mini-wheel-lose)'
                                    }
                                />
                            );
                        })}
                        {/* Center */}
                        <circle
                            cx="40"
                            cy="40"
                            r="10"
                            fill="oklch(90% 0.02 230)"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r="6"
                            fill="oklch(45% 0.12 230)"
                        />
                    </svg>
                    {/* Pointer */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                        <div className="size-0 border-x-4 border-t-6 border-x-transparent border-t-primary" />
                    </div>
                </div>
                <div className="ml-5 text-left">
                    <p className="text-2xl font-bold text-success">50%</p>
                    <p className="text-sm text-muted-foreground">Winkans</p>
                </div>
            </div>
        ),
    },
    {
        icon: (
            <svg viewBox="0 0 20 20" className="size-5 fill-current">
                <path d="M10 1 L12 7 L18 7 L13 11 L15 17 L10 13 L5 17 L7 11 L2 7 L8 7 Z" />
            </svg>
        ),
        title: 'Winnen!',
        description:
            'Verzamel genoeg punten en raad het geheime woord. De eerste die het raadt, wint!',
        visual: (
            <div className="flex flex-col items-center py-4">
                {/* Trophy visualization */}
                <div className="relative mb-3">
                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/25">
                        <svg
                            viewBox="0 0 24 24"
                            className="size-8 text-white"
                            fill="currentColor"
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                        1
                    </div>
                </div>
                <p className="font-display text-lg font-bold text-foreground">
                    Eerste = Winnaar
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Win een prijs!
                </p>
            </div>
        ),
    },
];

function getInitialOpenState(forceOpen: boolean): boolean {
    if (forceOpen) return true;
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(TUTORIAL_SEEN_KEY);
}

export function TutorialModal({
    forceOpen = false,
    onClose,
}: TutorialModalProps) {
    const [internalOpen, setInternalOpen] = useState(() =>
        getInitialOpenState(forceOpen),
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');

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
        [handleClose],
    );

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setDirection('next');
            setCurrentStep((s) => s + 1);
        } else {
            handleClose();
        }
    }, [currentStep, handleClose]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setDirection('prev');
            setCurrentStep((s) => s - 1);
        }
    }, [currentStep]);

    const handleStepClick = useCallback(
        (idx: number) => {
            setDirection(idx > currentStep ? 'next' : 'prev');
            setCurrentStep(idx);
        },
        [currentStep],
    );

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleNext, handlePrev]);

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-[360px] gap-0 overflow-hidden rounded-2xl border-0 bg-gradient-to-b from-card via-card to-background p-0 shadow-2xl [&>button:last-child]:hidden"
                aria-describedby="tutorial-step-description"
            >
                {/* Background frost effect */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {SNOWFLAKES.map((flake, i) => (
                        <div
                            key={i}
                            className="animate-snow-fall absolute"
                            style={{
                                left: `${flake.left}%`,
                                animationDelay: `${flake.delay}ms`,
                                animationDuration: `${flake.duration}s`,
                                opacity: flake.opacity,
                            }}
                        >
                            <Snowflake
                                className="text-primary"
                                style={{
                                    width: flake.size,
                                    height: flake.size,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close button - larger touch target */}
                <DialogClose
                    className="absolute top-2.5 right-2.5 z-10 flex size-11 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none active:bg-muted/80"
                    aria-label="Sluiten"
                >
                    <X className="size-5" />
                </DialogClose>

                {/* Content */}
                <div
                    key={currentStep}
                    className={cn(
                        'relative px-5 pt-12 pb-3',
                        'motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in',
                        direction === 'next'
                            ? 'motion-safe:slide-in-from-right-4'
                            : 'motion-safe:slide-in-from-left-4',
                    )}
                >
                    {/* Step icon + title */}
                    <div className="mb-2 flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {step.icon}
                        </div>
                        <DialogTitle className="font-display text-lg font-bold text-foreground">
                            {step.title}
                        </DialogTitle>
                    </div>

                    {/* Description */}
                    <DialogDescription
                        id="tutorial-step-description"
                        className="text-sm leading-relaxed text-muted-foreground"
                    >
                        {step.description}
                    </DialogDescription>

                    {/* Points badge */}
                    {step.points && (
                        <div className="mt-2.5">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                                    step.points.type === 'earn' &&
                                        'bg-success/15 text-success',
                                    step.points.type === 'cost' &&
                                        'bg-destructive/15 text-destructive',
                                    step.points.type === 'risk' &&
                                        'bg-warning/15 text-warning',
                                )}
                            >
                                {step.points.text}
                            </span>
                        </div>
                    )}

                    {/* Visual */}
                    <div className="mt-2">{step.visual}</div>
                </div>

                {/* Navigation footer */}
                <div className="relative grid grid-cols-[1fr_auto_1fr] items-center border-t border-border/50 bg-muted/30 px-3 py-2.5">
                    {/* Previous / Skip */}
                    <div className="justify-self-start">
                        {isFirstStep ? (
                            <button
                                onClick={handleClose}
                                className="flex h-10 items-center px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-foreground/80"
                            >
                                Overslaan
                            </button>
                        ) : (
                            <button
                                onClick={handlePrev}
                                className="flex h-10 items-center gap-0.5 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-foreground/80"
                            >
                                <svg
                                    viewBox="0 0 16 16"
                                    className="size-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M10 12 L6 8 L10 4" />
                                </svg>
                                Vorige
                            </button>
                        )}
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handleStepClick(i)}
                                className="group flex size-5 items-center justify-center"
                                aria-label={`Stap ${i + 1} van ${steps.length}`}
                                aria-current={
                                    i === currentStep ? 'step' : undefined
                                }
                            >
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full transition-all duration-300',
                                        i === currentStep
                                            ? 'scale-125 bg-primary'
                                            : i < currentStep
                                              ? 'bg-primary/40'
                                              : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50',
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Next / Start */}
                    <div className="justify-self-end">
                        <Button
                            size="sm"
                            onClick={handleNext}
                            className={cn(
                                'h-9 gap-0.5 px-3 text-sm font-semibold',
                                isLastStep &&
                                    'bg-success shadow-md shadow-success/25 hover:bg-success/90',
                            )}
                        >
                            {isLastStep ? (
                                'Start!'
                            ) : (
                                <>
                                    Volgende
                                    <svg
                                        viewBox="0 0 16 16"
                                        className="size-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M6 4 L10 8 L6 12" />
                                    </svg>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
