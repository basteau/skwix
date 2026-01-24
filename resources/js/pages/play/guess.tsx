import { Head } from '@inertiajs/react';
import PlayLayout from '@/layouts/play-layout';

export default function GuessPage() {
    return (
        <PlayLayout>
            <Head title="Vraag" />
            <div className="flex h-full flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold text-foreground">Vraag</h1>
                <p className="mt-2 text-muted-foreground">Stel ja/nee vragen over het woord</p>
            </div>
        </PlayLayout>
    );
}
