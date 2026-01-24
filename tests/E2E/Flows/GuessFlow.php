<?php

namespace Tests\E2E\Flows;

use Tests\E2E\Pages\GuessPage;
use Tests\E2E\Support\PlaywrightHelper;

/**
 * Flow for Question/Guess gameplay.
 */
class GuessFlow
{
    private PlaywrightHelper $playwright;

    private GuessPage $guessPage;

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
        $this->guessPage = new GuessPage($playwright);
    }

    /**
     * Ask a question and wait for the AI answer.
     */
    public function askAndWait(string $question): GuessPage
    {
        $this->guessPage
            ->visit()
            ->askQuestion($question)
            ->waitForAnswer();

        return $this->guessPage;
    }

    /**
     * Ask multiple questions in sequence.
     */
    public function askMultiple(array $questions): GuessPage
    {
        $this->guessPage->visit();

        foreach ($questions as $question) {
            $this->guessPage
                ->askQuestion($question)
                ->waitForAnswer();
        }

        return $this->guessPage;
    }

    /**
     * Verify question costs points.
     */
    public function verifyQuestionCost(string $question, int $originalPoints, int $cost): GuessPage
    {
        $this->guessPage
            ->visit()
            ->askQuestion($question)
            ->waitForAnswer()
            ->assertPointsDeducted($originalPoints, $cost);

        return $this->guessPage;
    }

    /**
     * Verify cannot ask when insufficient points.
     */
    public function verifyInsufficientPoints(): GuessPage
    {
        $this->guessPage
            ->visit()
            ->assertInputDisabled();

        return $this->guessPage;
    }
}
