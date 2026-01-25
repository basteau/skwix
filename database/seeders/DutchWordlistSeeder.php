<?php

namespace Database\Seeders;

use App\Services\WordlistService;
use Illuminate\Database\Seeder;

class DutchWordlistSeeder extends Seeder
{
    public function run(): void
    {
        $service = new WordlistService;
        $words = $service->getWords();

        if ($words->isEmpty()) {
            $this->command->error('Wordlist not found at public/woordenlijst.txt!');

            return;
        }

        if ($words->count() < 2048) {
            $this->command->error('Wordlist must contain at least 2048 words');

            return;
        }

        $allFiveLetters = $words->every(fn ($word) => mb_strlen($word) === 5);
        if (! $allFiveLetters) {
            $this->command->error('All words must be exactly 5 letters');

            return;
        }

        $uniqueCount = $words->unique()->count();
        if ($uniqueCount !== $words->count()) {
            $this->command->warn('Found '.($words->count() - $uniqueCount).' duplicate words');
        }

        $this->command->info('Dutch wordlist validated: '.$words->count().' words');
    }

    public static function getRandomWords(int $count): array
    {
        return (new WordlistService)->getRandomWords($count);
    }

    public static function getWords(): array
    {
        return (new WordlistService)->getWords()->all();
    }
}
