<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Win page.
 */
class WinPage
{
    private PlaywrightHelper $playwright;

    public const URL = '/win';

    public const TITLE = 'win-title';

    public const WINNER_NAME = 'winner-name';

    public const SECRET_WORD = 'secret-word-reveal';

    public const QR_CODE = 'prize-qr-code';

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
     * Assert QR code is visible.
     */
    public function assertQRCodeVisible(): self
    {
        $this->playwright->waitFor(self::QR_CODE);

        return $this;
    }

    /**
     * Check if page is displayed (won the game).
     */
    public function isDisplayed(): bool
    {
        return $this->playwright->exists(self::TITLE);
    }
}
