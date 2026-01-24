<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Welcome page.
 *
 * Encapsulates all selectors and interactions for E2E tests.
 */
class WelcomePage
{
    private PlaywrightHelper $playwright;

    public const URL = '/welcome';

    // Data-testid selectors
    public const INVITE_CODE_INPUT = 'invite-code-input';

    public const JOIN_GAME_BUTTON = 'join-game-button';

    public const CODE_ERROR = 'code-error';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    /**
     * Navigate to the welcome page.
     */
    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::INVITE_CODE_INPUT);

        return $this;
    }

    /**
     * Enter an invite code.
     */
    public function enterCode(string $code): self
    {
        $this->playwright->fill(self::INVITE_CODE_INPUT, $code);

        return $this;
    }

    /**
     * Click the join game button.
     */
    public function clickJoin(): self
    {
        $this->playwright->click(self::JOIN_GAME_BUTTON);

        return $this;
    }

    /**
     * Join a game with an invite code.
     */
    public function joinGame(string $code): self
    {
        return $this->enterCode($code)->clickJoin();
    }

    /**
     * Check if error message is visible.
     */
    public function hasError(): bool
    {
        return $this->playwright->exists(self::CODE_ERROR);
    }

    /**
     * Get error message text.
     */
    public function getErrorText(): string
    {
        return $this->playwright->getText(self::CODE_ERROR);
    }
}
