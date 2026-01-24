import { useCallback, useEffect, useRef, useState } from 'react';

interface UseClipboardOptions {
    resetDelay?: number;
}

interface UseClipboardReturn {
    copiedText: string | null;
    copy: (text: string) => Promise<boolean>;
    isCopied: boolean;
    reset: () => void;
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
    const { resetDelay = 2000 } = options;
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reset = useCallback(() => {
        setCopiedText(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const copy = useCallback(
        async (text: string): Promise<boolean> => {
            if (!navigator?.clipboard) {
                console.warn('Clipboard not supported');
                return false;
            }

            try {
                await navigator.clipboard.writeText(text);
                setCopiedText(text);

                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(reset, resetDelay);

                return true;
            } catch (error) {
                console.warn('Copy failed', error);
                setCopiedText(null);
                return false;
            }
        },
        [resetDelay, reset]
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        copiedText,
        copy,
        isCopied: copiedText !== null,
        reset,
    };
}
