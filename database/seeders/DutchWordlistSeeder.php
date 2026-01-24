<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class DutchWordlistSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/dutch_words.json');

        if (! File::exists($path)) {
            $this->command->error('dutch_words.json not found!');

            return;
        }

        $words = json_decode(File::get($path), true);

        if (! is_array($words) || count($words) < 2048) {
            $this->command->error('dutch_words.json must contain at least 2048 words');

            return;
        }

        $allFiveLetters = collect($words)->every(fn ($word) => mb_strlen($word) === 5);
        if (! $allFiveLetters) {
            $this->command->error('All words must be exactly 5 letters');

            return;
        }

        $uniqueCount = collect($words)->unique()->count();
        if ($uniqueCount !== count($words)) {
            $this->command->warn('Found '.count($words) - $uniqueCount.' duplicate words');
        }

        $this->command->info('Dutch wordlist validated: '.count($words).' words');
    }

    public static function getRandomWords(int $count): array
    {
        $path = database_path('seeders/dutch_words.json');
        $words = json_decode(File::get($path), true);

        return collect($words)->shuffle()->take($count)->values()->all();
    }

    public static function getWords(): array
    {
        $path = database_path('seeders/dutch_words.json');

        return json_decode(File::get($path), true);
    }
}
