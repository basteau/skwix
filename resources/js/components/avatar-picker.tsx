import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, User } from 'lucide-react';

const AVAILABLE_AVATARS = [
    'player09',
    'player07',
    'player06',
    'player08',
    'player05',
    'player04',
    'player01',
    'player02',
    'player03',
] as const;

export type AvatarName = (typeof AVAILABLE_AVATARS)[number] | '';

interface AvatarPickerProps {
    value: string;
    onChange: (avatar: string) => void;
    disabled?: boolean;
}

export function getAvatarUrl(avatar: string | null | undefined): string | undefined {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    return `/images/faces/${avatar}.png`;
}

export function AvatarPicker({ value, onChange, disabled }: AvatarPickerProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {/* No avatar option */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange('')}
                data-testid="avatar-option-none"
                className={cn(
                    'relative flex size-12 items-center justify-center rounded-full border-2 transition-all',
                    'hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    !value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/50',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <User className="size-5 text-muted-foreground" />
                {!value && (
                    <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" strokeWidth={3} />
                    </span>
                )}
            </button>

            {/* Avatar options */}
            {AVAILABLE_AVATARS.map((avatar) => {
                const isSelected = value === avatar;
                return (
                    <button
                        key={avatar}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(avatar)}
                        data-testid={`avatar-option-${avatar}`}
                        className={cn(
                            'relative rounded-full transition-all',
                            'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <Avatar
                            className={cn(
                                'size-12 border-2 transition-colors',
                                isSelected
                                    ? 'border-primary'
                                    : 'border-transparent hover:border-primary/30',
                            )}
                        >
                            <AvatarImage
                                src={getAvatarUrl(avatar)}
                                alt={avatar}
                            />
                            <AvatarFallback className="bg-muted text-xs capitalize">
                                {avatar.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                            <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="size-2.5" strokeWidth={3} />
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export { AVAILABLE_AVATARS };
