import { Head, useForm } from '@inertiajs/react';
import Snowflake from 'lucide-react/icons/snowflake';
import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Welcome() {
    const form = useForm({
        code: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!form.data.code.trim()) return;

        form.post('/login', {
            onError: () => {
                form.reset('code');
            },
        });
    };

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
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    {/* Back layer - large, faint, edges */}
                    <Snowflake className="absolute left-[5%] top-[8%] size-20 text-primary opacity-[0.03] motion-safe:animate-pulse" style={{ animationDuration: '6s' }} />
                    <Snowflake className="absolute right-[3%] top-[15%] size-24 text-primary opacity-[0.03] motion-safe:animate-pulse" style={{ animationDuration: '8s' }} />
                    <Snowflake className="absolute left-[8%] bottom-[12%] size-28 text-primary opacity-[0.03] motion-safe:animate-pulse" style={{ animationDuration: '7s' }} />
                    <Snowflake className="absolute right-[5%] bottom-[8%] size-22 text-primary opacity-[0.03] motion-safe:animate-pulse" style={{ animationDuration: '9s' }} />
                    
                    {/* Mid layer - medium, more visible */}
                    <Snowflake className="absolute left-[12%] top-[25%] size-12 text-primary opacity-[0.06] motion-safe:animate-pulse" style={{ animationDuration: '5s' }} />
                    <Snowflake className="absolute right-[10%] top-[35%] size-10 text-primary opacity-[0.06] motion-safe:animate-pulse" style={{ animationDuration: '6s' }} />
                    <Snowflake className="absolute left-[15%] bottom-[30%] size-14 text-primary opacity-[0.06] motion-safe:animate-pulse" style={{ animationDuration: '7s' }} />
                    <Snowflake className="absolute right-[12%] bottom-[25%] size-11 text-primary opacity-[0.06] motion-safe:animate-pulse" style={{ animationDuration: '5.5s' }} />
                    
                    {/* Front layer - small, most visible, closer to center */}
                    <Snowflake className="absolute left-[22%] top-[40%] size-6 text-primary opacity-[0.10] motion-safe:animate-pulse" style={{ animationDuration: '4s' }} />
                    <Snowflake className="absolute right-[20%] top-[50%] size-5 text-primary opacity-[0.10] motion-safe:animate-pulse" style={{ animationDuration: '4.5s' }} />
                    <Snowflake className="absolute left-[25%] bottom-[45%] size-7 text-primary opacity-[0.10] motion-safe:animate-pulse" style={{ animationDuration: '5s' }} />
                    <Snowflake className="absolute right-[22%] bottom-[40%] size-6 text-primary opacity-[0.10] motion-safe:animate-pulse" style={{ animationDuration: '4.2s' }} />
                </div>

                {/* Main content */}
                <main className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
                    {/* Logo/Title */}
                    <div className="mb-8">
                        <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
                            Skwix
                        </h1>
                        <p className="mt-3 text-lg font-medium text-foreground/70">
                            Raad het woord, versla je vrienden
                        </p>
                    </div>

                    {/* Invite form */}
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="invite-code" className="sr-only">
                                Uitnodigingscode
                            </label>
                            <Input
                                id="invite-code"
                                type="text"
                                value={form.data.code}
                                onChange={(e) => {
                                    form.setData('code', e.target.value.toUpperCase());
                                    form.clearErrors('code');
                                }}
                                placeholder="Voer je code in"
                                className="h-14 text-center font-mono text-lg tracking-[0.2em] uppercase placeholder:text-base placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
                                maxLength={16}
                                autoComplete="off"
                                aria-invalid={!!form.errors.code}
                                aria-describedby={form.errors.code ? 'code-error' : undefined}
                            />
                            {form.errors.code && (
                                <p id="code-error" className="text-sm text-destructive">
                                    {form.errors.code}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-12 text-base font-semibold"
                            disabled={!form.data.code.trim() || form.processing}
                        >
                            {form.processing ? 'Even kijken...' : 'Doe mee'}
                        </Button>
                    </form>

                    {/* Footer hint */}
                    <p className="mt-8 text-sm text-muted-foreground">
                        Geen code? Vraag de organisator om een uitnodiging.
                    </p>
                </main>
            </div>
        </>
    );
}
