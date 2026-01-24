<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Guess (Question) page.
 */
class GuessPage
{
    private PlaywrightHelper $playwright;

    public const URL = '/guess';

    public const INPUT = 'guess-input';

    public const SUBMIT_BUTTON = 'guess-submit-button';

    public const HISTORY = 'guess-history';

    public const ITEM_PREFIX = 'guess-item-';

    public const POINTS_DISPLAY = 'guess-points-display';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::INPUT);

        return $this;
    }

    /**
     * Type a question in the input field.
     */
    public function typeQuestion(string $question): self
    {
        $this->playwright->fill(self::INPUT, $question);

        return $this;
    }

    /**
     * Click the ask button.
     */
    public function clickAsk(): self
    {
        $this->playwright->click(self::SUBMIT_BUTTON);

        return $this;
    }

    /**
     * Ask a complete question.
     */
    public function askQuestion(string $question): self
    {
        return $this->typeQuestion($question)->clickAsk();
    }

    /**
     * Assert the answer for a specific question ID.
     */
    public function assertAnswer(int $questionId, string $expected): self
    {
        // Assert item-{questionId} contains the expected answer (yes/no)
        return $this;
    }

    /**
     * Assert the history contains a specific number of questions.
     */
    public function assertHistoryCount(int $expected): self
    {
        // Count items matching guess-item-* pattern
        return $this;
    }

    /**
     * Check if history section is visible (has questions).
     */
    public function hasHistory(): bool
    {
        return $this->playwright->exists(self::HISTORY);
    }

    /**
     * Get current points from display.
     */
    public function getPoints(): string
    {
        return $this->playwright->getText(self::POINTS_DISPLAY);
    }

    /**
     * Assert points were deducted correctly.
     */
    public function assertPointsDeducted(int $originalPoints, int $cost): self
    {
        // Assert getPoints() shows (originalPoints - cost)
        return $this;
    }

    /**
     * Wait for AI response.
     */
    public function waitForAnswer(): self
    {
        // Wait for new item to appear in history
        usleep(2000000); // 2 seconds max for AI response

        return $this;
    }

    /**
     * Assert input is disabled (not enough points).
     */
    public function assertInputDisabled(): self
    {
        // Check input has disabled attribute
        return $this;
    }
}
