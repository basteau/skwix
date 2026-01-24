<?php

namespace App\Services;

/**
 * Fake Fortune service for E2E testing.
 * Returns deterministic win/lose outcomes from a configurable sequence.
 */
class FakeFortuneService
{
    private array $sequence = ['win', 'lose'];

    private int $index = 0;

    public function __construct()
    {
        $sequenceConfig = config('e2e.fortune_sequence', 'win,lose');
        $this->sequence = array_map('trim', explode(',', $sequenceConfig));
    }

    /**
     * Spin the wheel and return deterministic outcome.
     */
    public function spin(): bool
    {
        $outcome = $this->sequence[$this->index % count($this->sequence)];
        $this->index++;

        return $outcome === 'win';
    }

    /**
     * Reset sequence index to start.
     */
    public function reset(): void
    {
        $this->index = 0;
    }

    /**
     * Set a specific sequence for testing.
     */
    public function setSequence(array $sequence): void
    {
        $this->sequence = $sequence;
        $this->index = 0;
    }
}
