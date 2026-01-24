import { Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
    return (
        <header className="pt-safe border-b border-border bg-card px-6 py-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
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
            )}

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
