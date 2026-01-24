import AlertCircleIcon from 'lucide-react/icons/alert-circle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    if (errors.length === 0) return null;

    return (
        <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>{title || 'Er ging iets mis.'}</AlertTitle>
            <AlertDescription>
                <ul className="list-inside list-disc text-sm">
                    {Array.from(new Set(errors)).map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}
