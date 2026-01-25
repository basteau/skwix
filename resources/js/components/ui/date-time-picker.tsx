import { format, isBefore, startOfToday, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    minDate?: Date;
    className?: string;
    disabled?: boolean;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Selecteer datum & tijd',
    minDate,
    className,
    disabled,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [time, setTime] = React.useState(() => {
        if (value) {
            return format(value, 'HH:mm');
        }
        return '08:00';
    });

    const effectiveMinDate = minDate ?? startOfToday();

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange(undefined);
            return;
        }
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        onChange(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTime(newTime);

        if (value && newTime) {
            const [hours, minutes] = newTime.split(':').map(Number);
            const newDate = new Date(value);
            newDate.setHours(hours, minutes, 0, 0);
            onChange(newDate);
        }
    };

    const isDateDisabled = (date: Date) => {
        return isBefore(date, effectiveMinDate);
    };

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !value && 'text-muted-foreground',
                        className
                    )}
                    data-testid="date-time-picker-trigger"
                >
                    <CalendarIcon className="mr-2 size-4" />
                    {value ? (
                        format(value, "EEEE d MMMM yyyy 'om' HH:mm", {
                            locale: nl,
                        })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    locale={nl}
                    defaultMonth={value ?? addDays(new Date(), 1)}
                />
                <div className="border-t p-3">
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <Input
                            type="time"
                            value={time}
                            onChange={handleTimeChange}
                            className="w-24"
                            data-testid="time-input"
                        />
                        <span className="text-xs text-muted-foreground">
                            ({timezone})
                        </span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function getDefaultStartDate(): Date {
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
}
