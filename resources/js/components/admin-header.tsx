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

    return (
        <header className="border-b border-border bg-card px-6 py-4 pt-[calc(var(--safe-top)+1rem)]">
            {/* Top bar with breadcrumbs and menu */}
            <div className="mb-2 flex items-center justify-between">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 ? (
                    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Link
                            href="/admin"
                            className="transition-colors hover:text-foreground"
                        >
                            Admin
                        </Link>
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <ChevronRight className="size-3.5" />
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
                ) : (
                    <div />
                )}

                {/* Menu dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    {/* Back button */}
                    {backHref && (
                        <Link
                            href={backHref}
                            className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                    )}

                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            {badge}
                        </div>
                        {subtitle && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2">{actions}</div>
                )}
            </div>
        </header>
    );
}
