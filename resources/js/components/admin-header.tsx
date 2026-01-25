import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, LogOut, MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
    backHref?: string;
    actions?: ReactNode;
    badge?: ReactNode;
}

export function AdminHeader({
    title,
    subtitle,
    breadcrumbs,
    backHref,
    actions,
    badge,
}: AdminHeaderProps) {
    const handleLogout = () => {
        router.flushAll();
    };

    const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

    return (
        <header className="border-b border-border bg-card px-3 pt-[calc(var(--safe-top)+0.25rem)] pb-2 sm:px-6 sm:pt-[calc(var(--safe-top)+0.5rem)] sm:pb-2.5">
            {/* Breadcrumbs - hidden on mobile (back button serves same purpose) */}
            {hasBreadcrumbs && (
                <nav className="mb-1 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <Link
                        href="/admin"
                        className="transition-colors hover:text-foreground"
                    >
                        Admin
                    </Link>
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <ChevronRight className="size-3" />
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="transition-colors hover:text-foreground"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-foreground">
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            {/* Main header row - single line on mobile */}
            <div className="flex h-10 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                    {/* Back button */}
                    {backHref && (
                        <Link
                            href={backHref}
                            className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                    )}

                    {/* Title + optional subtitle (subtitle hidden on mobile) */}
                    <div className="min-w-0">
                        <h1 className="truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                            {title}
                            {badge && <span className="ml-2">{badge}</span>}
                        </h1>
                        {subtitle && (
                            <p className="hidden truncate text-xs text-muted-foreground sm:block">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions + Menu */}
                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
                    {actions}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="-mr-1.5 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
                            data-testid="admin-menu-trigger"
                        >
                            <MoreVertical className="size-5" />
                            <span className="sr-only">Menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    onClick={handleLogout}
                                    data-testid="admin-logout-button"
                                    className="w-full cursor-pointer"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Afmelden
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
