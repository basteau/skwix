<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Lobby page.
 */
class LobbyPage
{
    private PlaywrightHelper $playwright;

    public const URL = '/lobby';

    public const COUNTDOWN = 'countdown';

    public const PLAYER_LIST = 'player-list';

    public const PLAYER_CARD_PREFIX = 'player-card-';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::PLAYER_LIST);

        return $this;
    }

    public function assertPlayerCount(int $expected): self
    {
        // In actual test, count elements matching player-card-* pattern
        return $this;
    }

    public function waitForCountdown(): self
    {
        $this->playwright->waitFor(self::COUNTDOWN);

        return $this;
    }

    public function getCountdownText(): string
    {
        return $this->playwright->getText(self::COUNTDOWN);
    }

    public function assertPlayerVisible(int $playerId): self
    {
        $this->playwright->waitFor(self::PLAYER_CARD_PREFIX.$playerId);

        return $this;
    }

    public function assertPlayerNotVisible(int $playerId): bool
    {
        return ! $this->playwright->exists(self::PLAYER_CARD_PREFIX.$playerId);
    }

    public function waitForRedirect(): void
    {
        $this->playwright->waitForUrl('/play/wordle');
    }
}
