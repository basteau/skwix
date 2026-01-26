import { getAvatarUrl } from '@/components/avatar-picker';
import { getInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { CSSProperties} from 'react';
import { useState } from 'react';

interface PlayerAvatarProps {
    name: string;
    avatarUrl: string | null | undefined;
    className?: string;
    fallbackClassName?: string;
    fallbackStyle?: CSSProperties;
}

export function PlayerAvatar({
    name,
    avatarUrl,
    className,
    fallbackClassName,
    fallbackStyle,
}: PlayerAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const src = getAvatarUrl(avatarUrl);
    const initials = getInitials(name);

    if (!src || imgError) {
        return (
            <div
                className={cn(
                    'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary',
                    className,
                    fallbackClassName,
                )}
                style={fallbackStyle}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            className={cn('shrink-0 rounded-full object-cover', className)}
            onError={() => setImgError(true)}
        />
    );
}
