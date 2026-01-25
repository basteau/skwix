<?php

namespace App\Services;

class WordleService
{
    /**
     * Evaluate a guess against the target word.
     * Returns array of letter statuses: 'correct', 'present', or 'absent'
     *
     * @return array<int, array{letter: string, status: string}>
     */
    public function evaluateGuess(string $guess, string $target): array
    {
        $guess = strtolower($guess);
        $target = strtolower($target);

        $guessLetters = str_split($guess);
        $targetLetters = str_split($target);

        $result = [];
        $targetCounts = array_count_values($targetLetters);

        // First pass: mark correct positions
        foreach ($guessLetters as $i => $letter) {
            if ($letter === $targetLetters[$i]) {
                $result[$i] = ['letter' => $letter, 'status' => 'correct'];
                $targetCounts[$letter]--;
            } else {
                $result[$i] = ['letter' => $letter, 'status' => 'pending'];
            }
        }

        // Second pass: mark present/absent
        foreach ($result as $i => &$item) {
            if ($item['status'] === 'pending') {
                $letter = $item['letter'];
                if (isset($targetCounts[$letter]) && $targetCounts[$letter] > 0) {
                    $item['status'] = 'present';
                    $targetCounts[$letter]--;
                } else {
                    $item['status'] = 'absent';
                }
            }
        }

        return array_values($result);
    }

    /**
     * Calculate points for a completed wordle.
     * Points are tied to guess cost (10 pts) using multipliers:
     * - 1 guess: 2.0x = 20 points
     * - 2 guesses: 1.7x = 17 points
     * - 3 guesses: 1.5x = 15 points
     * - 4 guesses: 1.4x = 14 points
     * - 5 guesses: 1.2x = 12 points
     * - 6 guesses: 1.0x = 10 points
     * - Failed (word not found): 0.8x = 8 points
     */
    public function calculatePoints(int $attempts, bool $isCorrect): int
    {
        $rewards = config('game.wordle_rewards');

        if (! $isCorrect) {
            return $rewards['failed'];
        }

        return $rewards[$attempts] ?? $rewards[6];
    }
}
