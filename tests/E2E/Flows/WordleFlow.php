<?php

namespace Tests\E2E\Flows;

use Tests\E2E\Pages\WordlePage;
use Tests\E2E\Support\PlaywrightHelper;

/**
 * Flow for completing Wordle gameplay.
 */
class WordleFlow
{
    private PlaywrightHelper $playwright;

    private WordlePage $wordlePage;

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
        $this->wordlePage = new WordlePage($playwright);
    }

    /**
     * Guess multiple words in sequence.
     */
    public function guessWords(array $words): self
    {
        foreach ($words as $index => $word) {
            $this->wordlePage->guess($word);

            // Wait for reveal animation if not the last word
            if ($index < count($words) - 1) {
                $this->wordlePage->waitForReveal($index);
            }
        }

        return $this;
    }

    /**
     * Complete wordle with a winning guess.
     */
    public function solveWordle(string $correctWord, array $wrongGuesses = []): WordlePage
    {
        $this->wordlePage->visit();

        foreach ($wrongGuesses as $index => $word) {
            $this->wordlePage->guess($word);
            $this->wordlePage->waitForReveal($index);
        }

        $this->wordlePage->guess($correctWord);
        $this->wordlePage->waitForReveal(count($wrongGuesses));

        return $this->wordlePage;
    }

    /**
     * Use all 6 attempts without solving.
     */
    public function exhaustAllAttempts(array $wrongGuesses): WordlePage
    {
        $this->wordlePage->visit();

        foreach ($wrongGuesses as $index => $word) {
            $this->wordlePage->guess($word);
            $this->wordlePage->waitForReveal($index);
        }

        return $this->wordlePage;
    }

    /**
     * Test invalid word handling.
     */
    public function testInvalidWord(string $invalidWord): WordlePage
    {
        $this->wordlePage
            ->visit()
            ->typeWord($invalidWord)
            ->submitGuess();

        // Should show error, row should shake
        return $this->wordlePage;
    }
}
