<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class WordlistService
{
    private const CACHE_KEY = 'dutch_wordlist';

    private const CACHE_TTL = 86400;

    public function getWords(): Collection
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $path = database_path('seeders/dutch_words.json');

            if (! File::exists($path)) {
                return collect();
            }

            return collect(json_decode(File::get($path), true));
        });
    }

    public function getRandomWords(int $count): array
    {
        return $this->getWords()->shuffle()->take($count)->values()->all();
    }

    public function isValidWord(string $word): bool
    {
        return $this->getWords()->contains(mb_strtolower($word));
    }

    public function count(): int
    {
        return $this->getWords()->count();
    }
}
