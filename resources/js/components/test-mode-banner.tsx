import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { FlaskConical, RotateCcw, X } from 'lucide-react';

interface TestModeBannerProps {
    className?: string;
    onReset?: () => void;
}

export function TestModeBanner({ className, onReset }: TestModeBannerProps) {
    const handleReset = () => {
        onReset?.();
        router.post('/test/reset');
    };

    const handleExit = () => {
        router.post('/test/exit');
    };

    return (
        <div
            className={cn(
                'pointer-events-auto absolute inset-x-0 top-[calc(var(--header-height)+var(--safe-top))] z-40',
                'flex items-center justify-between gap-2 bg-warning/90 px-3 py-1.5 backdrop-blur-sm',
                className,
            )}
        >
            <div className="flex items-center gap-1.5">
                <FlaskConical className="text-warning-foreground size-3.5" />
                <span className="text-warning-foreground text-xs font-semibold tracking-wider uppercase">
                    Test
                </span>
            </div>
            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-warning-foreground hover:bg-warning-foreground/20 hover:text-warning-foreground h-6 px-2 text-xs"
                >
                    <RotateCcw className="mr-1 size-3" />
                    Reset
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExit}
                    className="text-warning-foreground hover:bg-warning-foreground/20 hover:text-warning-foreground h-6 px-2 text-xs"
                >
                    <X className="mr-1 size-3" />
                    Stop
                </Button>
            </div>
        </div>
    );
}
