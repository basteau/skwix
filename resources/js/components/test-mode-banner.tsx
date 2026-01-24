import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { FlaskConical, RotateCcw, X } from 'lucide-react';

interface TestModeBannerProps {
    wordleWord?: string;
    className?: string;
    onReset?: () => void;
}

export function TestModeBanner({ wordleWord, className, onReset }: TestModeBannerProps) {
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
                'flex items-center justify-between gap-3 bg-gradient-to-r from-warning/20 via-warning/15 to-warning/10 px-4 py-2',
                'border-b border-warning/30',
                className,
            )}
        >
            <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-warning" />
                <span className="text-xs font-semibold uppercase tracking-wider text-warning">
                    Test Mode
                </span>
                {wordleWord && (
                    <span className="ml-2 rounded bg-warning/20 px-2 py-0.5 font-mono text-xs font-bold uppercase text-warning">
                        {wordleWord}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-7 px-2 text-xs text-warning hover:bg-warning/20 hover:text-warning"
                >
                    <RotateCcw className="mr-1 size-3" />
                    Reset
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExit}
                    className="h-7 px-2 text-xs text-warning hover:bg-warning/20 hover:text-warning"
                >
                    <X className="mr-1 size-3" />
                    Stop
                </Button>
            </div>
        </div>
    );
}
