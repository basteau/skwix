import PlayLayout from '@/layouts/play-layout';
import { Head } from '@inertiajs/react';
import { Snowflake } from 'lucide-react';

const SNOWFLAKES = Array.from({ length: 20 }).map((_, i) => ({
    left: (i * 5 + ((i * 17) % 12)) % 100,
    delay: (i * 400) % 5000,
    duration: 8 + (i % 5) * 2,
    size: 12 + (i % 4) * 6,
    opacity: 0.1 + (i % 4) * 0.05,
}));

interface NoActiveGameProps {
    title: string;
}

export function NoActiveGame({ title }: NoActiveGameProps) {
    return (
        <PlayLayout hideNav>
            <Head title={title} />
            <div className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-background p-6 text-center">
                {/* Animated falling snowflakes */}
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden="true"
                >
                    {SNOWFLAKES.map((flake, i) => (
                        <div
                            key={i}
                            className="absolute animate-snow-fall"
                            style={{
                                left: `${flake.left}%`,
                                animationDelay: `${flake.delay}ms`,
                                animationDuration: `${flake.duration}s`,
                                opacity: flake.opacity,
                            }}
                        >
                            <Snowflake
                                className="text-primary"
                                style={{ width: flake.size, height: flake.size }}
                            />
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-6 flex items-center justify-center">
                        <Snowflake className="size-16 animate-pulse text-primary/30" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        Nog even geduld...
                    </h1>
                    <p className="mt-3 max-w-xs text-muted-foreground">
                        Wacht tot de beheerder een spel start. De sneeuw valt al!
                    </p>
                </div>
            </div>
        </PlayLayout>
    );
}
