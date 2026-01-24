<?php

namespace Tests\E2E\Flows;

use Tests\E2E\Pages\FortunePage;
use Tests\E2E\Support\PlaywrightHelper;

/**
 * Flow for Wheel of Fortune gameplay.
 */
class FortuneFlow
{
    private PlaywrightHelper $playwright;

    private FortunePage $fortunePage;

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
        $this->fortunePage = new FortunePage($playwright);
    }

    /**
     * Spin the wheel with a specific wager.
     */
    public function spinWithWager(int $wager): FortunePage
    {
        $this->fortunePage
            ->visit()
            ->setWager($wager)
            ->clickSpin()
            ->waitForResult();

        return $this->fortunePage;
    }

    /**
     * Spin using the half button.
     */
    public function spinHalf(): FortunePage
    {
        $this->fortunePage
            ->visit()
            ->clickHalf()
            ->clickSpin()
            ->waitForResult();

        return $this->fortunePage;
    }

    /**
     * Spin using the max button.
     */
    public function spinMax(): FortunePage
    {
        $this->fortunePage
            ->visit()
            ->clickMax()
            ->clickSpin()
            ->waitForResult();

        return $this->fortunePage;
    }

    /**
     * Verify spin button is disabled for invalid wager.
     */
    public function verifySpinDisabled(int $invalidWager): FortunePage
    {
        $this->fortunePage
            ->visit()
            ->setWager($invalidWager);

        $this->fortunePage->assertSpinDisabled();

        return $this->fortunePage;
    }
}
