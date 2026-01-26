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
import { PlayerAvatar } from '@/components/player-avatar';
import { cn, getCsrfToken } from '@/lib/utils';
import { Loader2, Skull, Sparkles, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface SabotageTarget {
    id: number;
    name: string;
    avatar_url: string | null;
    points: number;
}

interface SabotageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: SabotageTarget | null;
    cost: number;
    currentPoints: number;
    onSuccess: (pointsRemaining: number) => void;
}

export function SabotageModal({
    open,
    onOpenChange,
    target,
    cost,
    currentPoints,
    onSuccess,
}: SabotageModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canAfford = currentPoints >= cost;

    const handleConfirm = useCallback(async () => {
        if (!target || isSubmitting || !canAfford) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/play/sabotage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ target_id: target.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessages: Record<string, string> = {
                    insufficient_points: 'Niet genoeg punten',
                    cannot_sabotage_self: 'Je kunt jezelf niet saboteren',
                    already_pending: 'Je hebt deze speler al gesaboteerd',
                    target_not_found: 'Speler niet gevonden',
                    game_not_active: 'Spel is niet actief',
                };
                setError(errorMessages[data.error] || 'Er ging iets mis');
                return;
            }

            onSuccess(data.points_remaining);
            onOpenChange(false);

            // Haptic feedback on success
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]);
            }
        } catch {
            setError('Verbinding mislukt');
        } finally {
            setIsSubmitting(false);
        }
    }, [target, isSubmitting, canAfford, onSuccess, onOpenChange]);

    // Reset error when modal closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setError(null);
        }
        onOpenChange(newOpen);
    };

    if (!target) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-[360px] gap-0 rounded-2xl border-destructive/20 p-0 [&>button:last-child]:hidden">
                {/* Close button */}
                <DialogClose
                    className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                    aria-label="Sluiten"
                >
                    <X className="size-4" />
                </DialogClose>

                <DialogHeader className="p-6 pb-4">
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                        <Skull className="size-7 text-destructive" />
                    </div>
                    <DialogTitle className="text-center font-display text-xl">
                        Sabotage!
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Saboteer de volgende vraag van{' '}
                        <span className="font-semibold text-foreground">
                            {target.name}
                        </span>
                        ?
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-4">
                    {/* Target preview */}
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                        <PlayerAvatar
                            name={target.name}
                            avatarUrl={target.avatar_url}
                            className="size-10"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">
                                {target.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {target.points} punten
                            </p>
                        </div>
                    </div>

                    {/* Effect explanation */}
                    <div className="mt-4 rounded-lg bg-destructive/5 p-3 text-sm">
                        <p className="font-medium text-destructive">
                            Wat gebeurt er?
                        </p>
                        <p className="mt-1 text-muted-foreground">
                            Het antwoord op hun volgende ja/nee vraag wordt
                            omgedraaid (ja wordt nee, nee wordt ja).
                        </p>
                    </div>

                    {/* Cost */}
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
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!canAfford || isSubmitting}
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <Skull className="size-4" />
                                Saboteren
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
