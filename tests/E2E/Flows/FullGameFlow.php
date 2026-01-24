<?php

namespace Tests\E2E\Flows;

use Tests\E2E\Pages\LosePage;
use Tests\E2E\Pages\WinPage;
use Tests\E2E\Support\PlaywrightHelper;

/**
 * Flow for complete end-to-end game scenarios.
 */
class FullGameFlow
{
    private PlaywrightHelper $playwright;

    private JoinFlow $joinFlow;

    private WordleFlow $wordleFlow;

    private GuessFlow $guessFlow;

    private FortuneFlow $fortuneFlow;

    private WinPage $winPage;

    private LosePage $losePage;

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
        $this->joinFlow = new JoinFlow($playwright);
        $this->wordleFlow = new WordleFlow($playwright);
        $this->guessFlow = new GuessFlow($playwright);
        $this->fortuneFlow = new FortuneFlow($playwright);
        $this->winPage = new WinPage($playwright);
        $this->losePage = new LosePage($playwright);
    }

    /**
     * Complete winning game flow.
     */
    public function playWinningGame(
        string $inviteCode,
        string $wordleWord,
        string $secretWord,
        int $wager = 5
    ): WinPage {
        // 1. Join game
        $this->joinFlow->joinGame($inviteCode);

        // 2. Complete wordle
        $this->wordleFlow->solveWordle($wordleWord);

        // 3. Ask a question
        $this->guessFlow->askAndWait('Is het een winter woord?');

        // 4. Spin wheel (forced win via fake service)
        $this->fortuneFlow->spinWithWager($wager);

        // 5. Guess the secret word (triggers win)
        // This would be done via direct API call or another UI flow
        // Game ends -> redirected to /win

        return $this->winPage;
    }

    /**
     * Play as losing player (another player wins).
     */
    public function playLosingGame(string $inviteCode, string $wordleWord): LosePage
    {
        // 1. Join game
        $this->joinFlow->joinGame($inviteCode);

        // 2. Complete wordle
        $this->wordleFlow->solveWordle($wordleWord);

        // 3. Wait for game to end (winner is another player)
        // Game ends -> redirected to /lose

        return $this->losePage;
    }

    /**
     * Get the join flow for chaining.
     */
    public function join(): JoinFlow
    {
        return $this->joinFlow;
    }

    /**
     * Get the wordle flow for chaining.
     */
    public function wordle(): WordleFlow
    {
        return $this->wordleFlow;
    }

    /**
     * Get the guess flow for chaining.
     */
    public function guess(): GuessFlow
    {
        return $this->guessFlow;
    }

    /**
     * Get the fortune flow for chaining.
     */
    public function fortune(): FortuneFlow
    {
        return $this->fortuneFlow;
    }
}
