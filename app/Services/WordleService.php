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
     * 6 points for 1 guess, 5 for 2, 4 for 3, minimum 3 for 4-6 guesses.
     * Failed wordle (6 guesses, not correct) still gets 3 points.
     */
    public function calculatePoints(int $attempts, bool $isCorrect): int
    {
        if (! $isCorrect) {
            return 3;
        }

        return match ($attempts) {
            1 => 6,
            2 => 5,
            3 => 4,
            default => 3,
        };
    }
}
