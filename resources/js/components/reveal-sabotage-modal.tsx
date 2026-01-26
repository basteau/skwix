import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn, getCsrfToken } from '@/lib/utils';
import { Eye, Loader2, Sparkles, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface RevealSabotageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cost: number;
    currentPoints: number;
    sabotagedCount: number;
    onSuccess: (pointsRemaining: number, sabotagedIds: number[]) => void;
}

export function RevealSabotageModal({
    open,
    onOpenChange,
    cost,
    currentPoints,
    sabotagedCount,
    onSuccess,
}: RevealSabotageModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canAfford = currentPoints >= cost;

    const handleConfirm = useCallback(async () => {
        if (isSubmitting || !canAfford) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/play/sabotage/reveal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessages: Record<string, string> = {
                    insufficient_points: 'Niet genoeg punten',
                };
                setError(errorMessages[data.error] || 'Er ging iets mis');
                return;
            }

            onSuccess(data.points_remaining, data.sabotaged_question_ids);
            onOpenChange(false);

            // Haptic feedback on success
            if ('vibrate' in navigator) {
                navigator.vibrate([30, 20, 30]);
            }
        } catch {
            setError('Verbinding mislukt');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, canAfford, onSuccess, onOpenChange]);

    // Reset error when modal closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setError(null);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-[360px] gap-0 rounded-2xl border-amber-500/20 p-0 [&>button:last-child]:hidden">
                {/* Close button */}
                <DialogClose
                    className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                    aria-label="Sluiten"
                >
                    <X className="size-4" />
                </DialogClose>

                <DialogHeader className="p-6 pb-4">
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-amber-500/10">
                        <Eye className="size-7 text-amber-500" />
                    </div>
                    <DialogTitle className="text-center font-display text-xl">
                        Sabotages Onthullen
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Ontdek welke van jouw antwoorden zijn gesaboteerd.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-4">
                    <div className="rounded-lg bg-amber-500/5 p-3 text-sm">
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                            {sabotagedCount > 0
                                ? `${sabotagedCount} vraag${sabotagedCount > 1 ? 'en' : ''} gesaboteerd`
                                : 'Mogelijk gesaboteerd'}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                            Na betaling zie je bij Vragen Stellen welke
                            antwoorden zijn omgedraaid door sabotage.
                        </p>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        <span
                            className={cn(
                                'font-display font-bold',
                                canAfford
                                    ? 'text-foreground'
                                    : 'text-destructive',
                            )}
                        >
                            {cost} punten
                        </span>
                    </div>

                    {error && (
                        <p className="mt-3 text-center text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    {!canAfford && !error && (
                        <p className="mt-3 text-center text-sm text-destructive">
                            Je hebt {cost} punten nodig
                        </p>
                    )}
                </div>

                <DialogFooter className="flex-row gap-2 border-t border-border/50 p-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        Annuleren
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!canAfford || isSubmitting}
                        className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <Eye className="size-4" />
                                Onthullen
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
