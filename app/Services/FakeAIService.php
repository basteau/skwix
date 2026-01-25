<?php

namespace App\Services;

/**
 * Fake AI service for E2E testing.
 * Returns deterministic yes/no responses from a configurable sequence.
 * Extends OpenRouterService so it can be used as a drop-in replacement.
 */
class FakeAIService extends OpenRouterService
{
    private array $sequence = ['yes', 'no'];

    private int $index = 0;

    public function __construct()
    {
        // Don't call parent - we don't need real API config
        $sequenceConfig = config('e2e.ai_sequence', 'yes,no');
        $this->sequence = array_map('trim', explode(',', $sequenceConfig));
    }

    #[\Override]
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

    public function reset(): void
    {
        $this->index = 0;
    }

    public function setSequence(array $sequence): void
    {
        $this->sequence = $sequence;
        $this->index = 0;
    }

    #[\Override]
    public function classifyQuestion(string $question): array
    {
        return [
            'success' => true,
            'type' => 'property_question',
        ];
    }
}
