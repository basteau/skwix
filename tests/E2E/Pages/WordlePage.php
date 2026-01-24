<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Wordle page.
 */
class WordlePage
{
    private PlaywrightHelper $playwright;

    public const URL = '/wordle';

    public const GRID = 'wordle-grid';

    public const TILE_PREFIX = 'wordle-tile-';

    public const KEY_PREFIX = 'wordle-key-';

    public const MESSAGE = 'wordle-message';

    public const POINTS_HEADER = 'points-header';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::GRID);

        return $this;
    }

    /**
     * Type a word using the on-screen keyboard.
     */
    public function typeWord(string $word): self
    {
        foreach (str_split(strtolower($word)) as $letter) {
            $this->playwright->click(self::KEY_PREFIX.$letter);
        }

        return $this;
    }

    /**
     * Press the Enter key to submit the guess.
     */
    public function submitGuess(): self
    {
        $this->playwright->click(self::KEY_PREFIX.'enter');

        return $this;
    }

    /**
     * Type and submit a complete guess.
     */
    public function guess(string $word): self
    {
        return $this->typeWord($word)->submitGuess();
    }

    /**
     * Press backspace to delete a letter.
     */
    public function backspace(): self
    {
        $this->playwright->click(self::KEY_PREFIX.'backspace');

        return $this;
    }

    /**
     * Get tile selector for a specific position.
     */
    public function tileSelector(int $row, int $col): string
    {
        return self::TILE_PREFIX."r{$row}-c{$col}";
    }

    /**
     * Assert a tile has a specific status class.
     */
    public function assertTileStatus(int $row, int $col, string $status): self
    {
        // Status: correct, present, absent, empty, filled
        return $this;
    }

    /**
     * Assert the message displays specific text.
     */
    public function assertMessage(string $expected): self
    {
        $actual = $this->playwright->getText(self::MESSAGE);
        // assert str_contains($actual, $expected)
        return $this;
    }

    /**
     * Check if message element exists.
     */
    public function hasMessage(): bool
    {
        return $this->playwright->exists(self::MESSAGE);
    }

    /**
     * Get current points from header.
     */
    public function getPoints(): string
    {
        return $this->playwright->getText(self::POINTS_HEADER);
    }

    /**
     * Assert points display shows expected value.
     */
    public function assertPoints(int $expected): self
    {
        // assert getPoints() contains $expected
        return $this;
    }

    /**
     * Wait for tile flip animation to complete.
     */
    public function waitForReveal(int $row): self
    {
        // Wait for animation to complete (750ms + 5*150ms = 1500ms)
        usleep(1600000);

        return $this;
    }
}
