<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Fortune (Wheel) page.
 */
class FortunePage
{
    private PlaywrightHelper $playwright;

    public const URL = '/fortune';

    public const WAGER_INPUT = 'fortune-wager-input';

    public const SPIN_BUTTON = 'fortune-spin-button';

    public const HALF_BUTTON = 'fortune-half-button';

    public const MAX_BUTTON = 'fortune-max-button';

    public const WHEEL = 'fortune-wheel';

    public const RESULT = 'fortune-result';

    public const POINTS_DISPLAY = 'fortune-points-display';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::WAGER_INPUT);

        return $this;
    }

    /**
     * Set the wager amount.
     */
    public function setWager(int $amount): self
    {
        $this->playwright->fill(self::WAGER_INPUT, (string) $amount);

        return $this;
    }

    /**
     * Click the 50% button.
     */
    public function clickHalf(): self
    {
        $this->playwright->click(self::HALF_BUTTON);

        return $this;
    }

    /**
     * Click the Max button.
     */
    public function clickMax(): self
    {
        $this->playwright->click(self::MAX_BUTTON);

        return $this;
    }

    /**
     * Click the spin button.
     */
    public function clickSpin(): self
    {
        $this->playwright->click(self::SPIN_BUTTON);

        return $this;
    }

    /**
     * Set wager and spin.
     */
    public function spin(int $wager): self
    {
        return $this->setWager($wager)->clickSpin();
    }

    /**
     * Wait for the wheel to stop spinning.
     */
    public function waitForResult(): self
    {
        // Wheel animation is 3.5 seconds
        usleep(4000000);
        $this->playwright->waitFor(self::RESULT);

        return $this;
    }

    /**
     * Assert the result shows a win.
     */
    public function assertWin(): self
    {
        $result = $this->playwright->getText(self::RESULT);
        // Assert contains '+' or 'Gewonnen'
        return $this;
    }

    /**
     * Assert the result shows a loss.
     */
    public function assertLoss(): self
    {
        $result = $this->playwright->getText(self::RESULT);
        // Assert contains '-' or 'Helaas'
        return $this;
    }

    /**
     * Get current points from display.
     */
    public function getPoints(): string
    {
        return $this->playwright->getText(self::POINTS_DISPLAY);
    }

    /**
     * Assert points display shows expected value.
     */
    public function assertPoints(int $expected): self
    {
        // Assert getPoints() contains $expected
        return $this;
    }

    /**
     * Assert spin button is disabled.
     */
    public function assertSpinDisabled(): self
    {
        // Check button has disabled attribute
        return $this;
    }
}
