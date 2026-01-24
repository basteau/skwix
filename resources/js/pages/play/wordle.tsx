import { Head } from '@inertiajs/react';
import PlayLayout from '@/layouts/play-layout';

export default function WordlePage() {
    return (
        <PlayLayout>
            <Head title="Wordle" />
            <div className="flex h-full flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold text-foreground">Wordle</h1>
                <p className="mt-2 text-muted-foreground">Dagelijkse woordpuzzel</p>
            </div>
        </PlayLayout>
    );
}
