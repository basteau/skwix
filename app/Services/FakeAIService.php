<?php

namespace App\Services;

/**
 * Fake AI service for E2E testing.
 * Returns deterministic yes/no responses from a configurable sequence.
 */
class FakeAIService
{
    private array $sequence = ['yes', 'no'];

    private int $index = 0;

    public function __construct()
    {
        $sequenceConfig = config('e2e.ai_sequence', 'yes,no');
        $this->sequence = array_map('trim', explode(',', $sequenceConfig));
    }

    public function askQuestion(string $secretWord, string $question): array
    {
        $answer = $this->sequence[$this->index % count($this->sequence)];
        $this->index++;

        return [
            'success' => true,
            'answer' => $answer,
            'raw_answer' => $answer === 'yes' ? 'Yes' : 'No',
        ];
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
