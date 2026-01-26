import { getAvatarUrl, getPortraitUrl } from '@/components/avatar-picker';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface WinnerAvatarProps {
    name: string;
    avatarUrl: string | null | undefined;
    portraitClassName?: string;
    avatarClassName?: string;
    fallbackClassName?: string;
    testId?: string;
}

export function WinnerAvatar({
    name,
    avatarUrl,
    portraitClassName = 'size-32 rounded-2xl border-4 border-amber-400/60',
    avatarClassName = 'size-20 rounded-full border-4 border-amber-400/60',
    fallbackClassName = 'size-20 rounded-full border-4 border-amber-400/60 bg-gradient-to-br from-primary/20 to-primary/10 font-display text-2xl font-bold text-primary',
    testId,
}: WinnerAvatarProps) {
    const [portraitError, setPortraitError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    const portraitUrl = getPortraitUrl(avatarUrl);
    const faceUrl = getAvatarUrl(avatarUrl);
    const initials = getInitials(name);

    if (portraitUrl && !portraitError) {
        return (
            <img
                src={portraitUrl}
                alt={name}
                data-testid={testId}
                className={cn('object-cover shadow-lg', portraitClassName)}
                onError={() => setPortraitError(true)}
            />
        );
    }

    if (faceUrl && !avatarError) {
        return (
            <img
                src={faceUrl}
                alt={name}
                className={cn('object-cover shadow-lg', avatarClassName)}
                onError={() => setAvatarError(true)}
            />
        );
    }

    return (
        <div
            className={cn(
                'flex items-center justify-center shadow-lg',
                fallbackClassName,
            )}
        >
            {initials}
        </div>
    );
}
