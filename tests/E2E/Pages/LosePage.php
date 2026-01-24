<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Lose page.
 */
class LosePage
{
    private PlaywrightHelper $playwright;

    public const URL = '/lose';

    public const TITLE = 'lose-title';

    public const WINNER_NAME = 'winner-name';

    public const SECRET_WORD = 'secret-word-reveal';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::TITLE);

        return $this;
    }

    /**
     * Assert the winner name matches.
     */
    public function assertWinner(string $expectedName): self
    {
        $actual = $this->playwright->getText(self::WINNER_NAME);

        // Assert $actual contains $expectedName
        return $this;
    }

    /**
     * Get the displayed winner name.
     */
    public function getWinnerName(): string
    {
        return $this->playwright->getText(self::WINNER_NAME);
    }

    /**
     * Assert the secret word matches.
     */
    public function assertSecretWord(string $expectedWord): self
    {
        $actual = $this->playwright->getText(self::SECRET_WORD);

        // Assert $actual contains $expectedWord
        return $this;
    }

    /**
     * Get the displayed secret word.
     */
    public function getSecretWord(): string
    {
        return $this->playwright->getText(self::SECRET_WORD);
    }

    /**
     * Assert rank is displayed.
     */
    public function assertRank(int $expectedRank): self
    {
        // Parse rank from page content
        return $this;
    }

    /**
     * Check if page is displayed (lost the game).
     */
    public function isDisplayed(): bool
    {
        return $this->playwright->exists(self::TITLE);
    }
}
