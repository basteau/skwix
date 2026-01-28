import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
    return (
        <Sonner
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
                    title: 'group-[.toast]:font-semibold group-[.toast]:text-foreground',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-md',
                    closeButton:
                        'group-[.toast]:bg-card group-[.toast]:text-muted-foreground group-[.toast]:border-border group-[.toast]:hover:bg-muted',
                    success:
                        'group-[.toaster]:bg-success/10 group-[.toaster]:border-success/30 group-[.toaster]:text-success [&>svg]:text-success',
                    error: 'group-[.toaster]:bg-destructive/10 group-[.toaster]:border-destructive/30 group-[.toaster]:text-destructive [&>svg]:text-destructive',
                    warning:
                        'group-[.toaster]:bg-warning/10 group-[.toaster]:border-warning/30 group-[.toaster]:text-[oklch(50%_0.18_85)] [&>svg]:text-[oklch(50%_0.18_85)]',
                    info: 'group-[.toaster]:bg-primary/10 group-[.toaster]:border-primary/30 [&>svg]:text-primary',
                },
            }}
            position="top-center"
            richColors
            {...props}
        />
    );
}

export { Toaster, toast };
