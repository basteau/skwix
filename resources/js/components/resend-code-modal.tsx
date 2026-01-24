import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, getCsrfToken } from '@/lib/utils';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ResendCodeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ModalState = 'idle' | 'loading' | 'success' | 'error';

export function ResendCodeModal({ open, onOpenChange }: ResendCodeModalProps) {
    const [email, setEmail] = useState('');
    const [state, setState] = useState<ModalState>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setEmail('');
            setState('idle');
            setError(null);
        }
    }, [open]);

    useEffect(() => {
        if (state === 'success') {
            const timer = setTimeout(() => {
                onOpenChange(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [state, onOpenChange]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!email.trim() || state === 'loading') return;

            setState('loading');
            setError(null);

            try {
                const response = await fetch('/resend-invitation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ email: email.trim() }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Er ging iets mis.');
                }

                setState('success');
            } catch (err) {
                setState('error');
                setError(
                    err instanceof Error ? err.message : 'Er ging iets mis.',
                );
            }
        },
        [email, state],
    );

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[360px] gap-0 overflow-hidden rounded-2xl border-primary/10 bg-gradient-to-b from-card via-card to-background p-0">
                <DialogHeader className="p-6 pb-4">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="size-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center font-display text-xl">
                        Code kwijt?
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Vul je e-mailadres in en we sturen je code opnieuw.
                    </DialogDescription>
                </DialogHeader>

                {state === 'success' ? (
                    <div className="px-6 pb-6 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
                        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle2 className="size-7 text-success" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Als dit e-mailadres bekend is, ontvang je binnen
                            enkele minuten je code.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 pb-6">
                        <div className="space-y-3">
                            <Input
                                type="email"
                                placeholder="person-3b9ad4d817@example.invalid"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={state === 'loading'}
                                className="h-12 text-center"
                                autoComplete="email"
                                autoFocus
                            />
                            {error && (
                                <p className="text-center text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={
                                    !isValidEmail ||
                                    state === 'loading' ||
                                    !email.trim()
                                }
                                className={cn(
                                    'h-12 w-full font-semibold',
                                    state === 'loading' && 'cursor-wait',
                                )}
                            >
                                {state === 'loading' ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="size-4 animate-spin" />
                                        Versturen...
                                    </span>
                                ) : (
                                    'Verstuur code'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
