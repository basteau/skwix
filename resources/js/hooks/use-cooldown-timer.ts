import { useEffect, useState } from 'react';

export function useCooldownTimer(initialSeconds: number = 0) {
    const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

    useEffect(() => {
        setRemainingSeconds(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        if (remainingSeconds <= 0) return;

        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [remainingSeconds > 0]);

    return {
        remainingSeconds,
        isOnCooldown: remainingSeconds > 0,
        formatted: formatCooldown(remainingSeconds),
    };
}

function formatCooldown(seconds: number): string {
    if (seconds <= 0) return '';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}u ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}
