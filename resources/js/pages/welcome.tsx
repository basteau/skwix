import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, type FormEvent } from 'react';
import { Snowflake } from 'lucide-react';

export default function Welcome() {
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        
        setIsValidating(true);
        setError(null);

        try {
            const response = await fetch('/api/validate-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ code: code.toUpperCase() }),
            });

            const data = await response.json();

            if (data.valid) {
                router.visit('/lobby');
            } else {
                setError(data.message || 'Ongeldige code');
            }
        } catch {
            setError('Er ging iets mis. Probeer opnieuw.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <>
            <Head title="Skwix - Winterse Woordpret" />
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6">
                {/* Subtle snowflake decorations */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]" aria-hidden>
                    <Snowflake className="absolute left-[10%] top-[15%] size-12 text-primary animate-pulse" style={{ animationDuration: '4s' }} />
                    <Snowflake className="absolute right-[15%] top-[10%] size-8 text-primary animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                    <Snowflake className="absolute left-[20%] bottom-[20%] size-10 text-primary animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
                    <Snowflake className="absolute right-[10%] bottom-[30%] size-14 text-primary animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }} />
                    <Snowflake className="absolute left-[5%] top-[50%] size-6 text-primary animate-pulse" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }} />
                    <Snowflake className="absolute right-[25%] top-[40%] size-10 text-primary animate-pulse" style={{ animationDuration: '5s', animationDelay: '3s' }} />
                </div>

                {/* Main content */}
                <main className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
                    {/* Logo/Title */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground">
                            Skwix
                        </h1>
                        <p className="mt-3 text-lg text-muted-foreground">
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
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError(null);
                                }}
                                placeholder="VOER JE CODE IN"
                                className="h-14 text-center font-mono text-xl tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-sm placeholder:lowercase"
                                maxLength={8}
                                autoComplete="off"
                                aria-invalid={!!error}
                                aria-describedby={error ? 'code-error' : undefined}
                            />
                            {error && (
                                <p id="code-error" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-12 text-base font-semibold"
                            disabled={!code.trim() || isValidating}
                        >
                            {isValidating ? 'Even kijken...' : 'Doe mee'}
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
