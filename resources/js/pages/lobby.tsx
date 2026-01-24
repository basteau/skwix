import { Head } from '@inertiajs/react';
import { Snowflake, Users } from 'lucide-react';

export default function Lobby() {
    return (
        <>
            <Head title="Lobby - Skwix" />
            <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
                <div className="text-center">
                    <div className="mb-6 flex items-center justify-center gap-2 text-primary">
                        <Users className="size-8" />
                        <Snowflake className="size-6 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welkom in de lobby!
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        Het spel begint binnenkort...
                    </p>
                </div>
            </div>
        </>
    );
}
