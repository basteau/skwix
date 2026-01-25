import { cn } from '@/lib/utils';

interface SkipLinkProps {
    href?: string;
    children?: React.ReactNode;
    className?: string;
}

export function SkipLink({
    href = '#main-content',
    children = 'Ga naar inhoud',
    className,
}: SkipLinkProps) {
    return (
        <a
            href={href}
            className={cn(
                'sr-only focus:not-sr-only',
                'focus:fixed focus:left-4 focus:top-4 focus:z-[9999]',
                'focus:rounded-md focus:bg-primary focus:px-4 focus:py-2',
                'focus:text-sm focus:font-medium focus:text-primary-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                className,
            )}
        >
            {children}
        </a>
    );
}
