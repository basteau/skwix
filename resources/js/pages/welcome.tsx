import { ResendCodeModal } from '@/components/resend-code-modal';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { getCsrfToken } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { REGEXP_ONLY_CHARS } from 'input-otp';
import { Snowflake } from 'lucide-react';
import { type FormEvent, useCallback, useState } from 'react';

export default function Welcome() {
    const [showResendModal, setShowResendModal] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            if (!code.trim() || isSubmitting) return;

            setIsSubmitting(true);
            setError(null);

            try {
                const response = await fetch('/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ code: code.trim() }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    setError(data.message ?? 'Code ongeldig');
                    setIsSubmitting(false);
                    return;
                }

                router.visit('/play/wordle');
            } catch {
                setError('Er ging iets mis. Probeer opnieuw.');
                setIsSubmitting(false);
            }
        },
        [code, isSubmitting],
    );

    return (
        <>
            <Head title="Skwix - Winterse Woordpret" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6">
                {/* Subtle gradient accent at bottom */}
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary/[0.03] to-transparent"
                    aria-hidden="true"
                />

                {/* Snowflake decorations - 3 depth layers framing content */}
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden="true"
                >
                    {/* Back layer - large, faint, edges */}
                    <Snowflake
                        className="absolute top-[8%] left-[5%] size-20 text-primary opacity-[0.03] motion-safe:animate-pulse"
                        style={{ animationDuration: '6s' }}
                    />
                    <Snowflake
                        className="absolute top-[15%] right-[3%] size-24 text-primary opacity-[0.03] motion-safe:animate-pulse"
                        style={{ animationDuration: '8s' }}
                    />
                    <Snowflake
                        className="absolute bottom-[12%] left-[8%] size-28 text-primary opacity-[0.03] motion-safe:animate-pulse"
                        style={{ animationDuration: '7s' }}
                    />
                    <Snowflake
                        className="absolute right-[5%] bottom-[8%] size-22 text-primary opacity-[0.03] motion-safe:animate-pulse"
                        style={{ animationDuration: '9s' }}
                    />

                    {/* Mid layer - medium, more visible */}
                    <Snowflake
                        className="absolute top-[25%] left-[12%] size-12 text-primary opacity-[0.06] motion-safe:animate-pulse"
                        style={{ animationDuration: '5s' }}
                    />
                    <Snowflake
                        className="absolute top-[35%] right-[10%] size-10 text-primary opacity-[0.06] motion-safe:animate-pulse"
                        style={{ animationDuration: '6s' }}
                    />
                    <Snowflake
                        className="absolute bottom-[30%] left-[15%] size-14 text-primary opacity-[0.06] motion-safe:animate-pulse"
                        style={{ animationDuration: '7s' }}
                    />
                    <Snowflake
                        className="absolute right-[12%] bottom-[25%] size-11 text-primary opacity-[0.06] motion-safe:animate-pulse"
                        style={{ animationDuration: '5.5s' }}
                    />

                    {/* Front layer - small, most visible, closer to center */}
                    <Snowflake
                        className="absolute top-[40%] left-[22%] size-6 text-primary opacity-[0.10] motion-safe:animate-pulse"
                        style={{ animationDuration: '4s' }}
                    />
                    <Snowflake
                        className="absolute top-[50%] right-[20%] size-5 text-primary opacity-[0.10] motion-safe:animate-pulse"
                        style={{ animationDuration: '4.5s' }}
                    />
                    <Snowflake
                        className="absolute bottom-[45%] left-[25%] size-7 text-primary opacity-[0.10] motion-safe:animate-pulse"
                        style={{ animationDuration: '5s' }}
                    />
                    <Snowflake
                        className="absolute right-[22%] bottom-[40%] size-6 text-primary opacity-[0.10] motion-safe:animate-pulse"
                        style={{ animationDuration: '4.2s' }}
                    />
                </div>

                {/* Main content */}
                <main className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
                    {/* Logo/Title - generous spacing below */}
                    <div className="mb-12">
                        <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
                            Skwix
                        </h1>
                        <p className="mt-2 text-lg font-medium text-foreground/70">
                            Raad het woord, versla je vrienden
                        </p>
                    </div>

                    {/* Invite form - grouped in subtle container */}
                    <form
                        onSubmit={handleSubmit}
                        className="w-full rounded-xl bg-card/50 p-6 shadow-sm ring-1 ring-border"
                    >
                        <div className="flex flex-col items-center space-y-3">
                            <label htmlFor="invite-code" className="sr-only">
                                Uitnodigingscode
                            </label>
                            <InputOTP
                                id="invite-code"
                                data-testid="invite-code-input"
                                maxLength={6}
                                value={code}
                                onChange={(value) => {
                                    setCode(value.toUpperCase());
                                    setError(null);
                                }}
                                pattern={REGEXP_ONLY_CHARS.source}
                                aria-invalid={!!error}
                                aria-describedby={
                                    error ? 'code-error' : undefined
                                }
                                textTransform="uppercase"
                                inputMode="text"
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot
                                        index={0}
                                        className="size-12 text-lg font-mono font-semibold"
                                    />
                                    <InputOTPSlot
                                        index={1}
                                        className="size-12 text-lg font-mono font-semibold"
                                    />
                                    <InputOTPSlot
                                        index={2}
                                        className="size-12 text-lg font-mono font-semibold"
                                    />
                                    <InputOTPSlot
                                        index={3}
                                        className="size-12 text-lg font-mono font-semibold"
                                    />
                                    <InputOTPSlot
                                        index={4}
                                        className="size-12 text-lg font-mono font-semibold"
                                    />
                                    <InputOTPSlot
                                        index={5}
                                        className="size-12 text-lg font-mono font-semibold"
                                    />
                                </InputOTPGroup>
                            </InputOTP>
                            {error && (
                                <p
                                    id="code-error"
                                    data-testid="code-error"
                                    className="text-sm text-destructive"
                                >
                                    {error}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            data-testid="join-game-button"
                            className="mt-4 h-12 w-full text-base font-semibold"
                            disabled={code.length < 6 || isSubmitting}
                        >
                            {isSubmitting ? 'Even kijken...' : 'Doe mee'}
                        </Button>
                    </form>

                    {/* Footer hint */}
                    <p className="mt-8 text-sm text-muted-foreground">
                        Geen code?{' '}
                        <button
                            type="button"
                            onClick={() => setShowResendModal(true)}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            data-testid="resend-code-trigger"
                        >
                            Code kwijt?
                        </button>
                    </p>
                </main>

                <ResendCodeModal
                    open={showResendModal}
                    onOpenChange={setShowResendModal}
                />
            </div>
        </>
    );
}
