import { Head } from '@inertiajs/react';
import PlayLayout from '@/layouts/play-layout';

export default function FortunePage() {
    return (
        <PlayLayout>
            <Head title="Rad" />
            <div className="flex h-full flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold text-foreground">Rad van Fortuin</h1>
                <p className="mt-2 text-muted-foreground">Gok je punten</p>
            </div>
        </PlayLayout>
    );
}
