import type * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckboxFieldProps
    extends Omit<
        React.ComponentProps<typeof CheckboxPrimitive.Root>,
        'children'
    > {
    label: React.ReactNode;
    description?: React.ReactNode;
}

function CheckboxField({
    id,
    label,
    description,
    disabled,
    className,
    ...props
}: CheckboxFieldProps) {
    const generatedId = React.useId();
    const fieldId = id || generatedId;

    return (
        <div
            className={cn('group flex items-start gap-2', className)}
            data-disabled={disabled || undefined}
        >
            <Checkbox id={fieldId} disabled={disabled} {...props} />
            <div className="grid gap-1 leading-none">
                <Label htmlFor={fieldId}>{label}</Label>
                {description && (
                    <p className="text-muted-foreground group-data-[disabled]:opacity-50 text-sm">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

export { CheckboxField };
