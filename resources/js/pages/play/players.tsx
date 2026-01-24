import { Head } from '@inertiajs/react';
import PlayLayout from '@/layouts/play-layout';

export default function PlayersPage() {
    return (
        <PlayLayout>
            <Head title="Spelers" />
            <div className="flex h-full flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold text-foreground">Spelers</h1>
                <p className="mt-2 text-muted-foreground">Bekijk de ranglijst</p>
            </div>
        </PlayLayout>
    );
}
