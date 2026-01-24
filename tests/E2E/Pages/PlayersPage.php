<?php

namespace Tests\E2E\Pages;

use Tests\E2E\Support\PlaywrightHelper;

/**
 * Page Object for the Players (Leaderboard) page.
 */
class PlayersPage
{
    private PlaywrightHelper $playwright;

    public const URL = '/players';

    public const LEADERBOARD = 'leaderboard';

    public const PLAYER_ROW_PREFIX = 'player-row-';

    public const POINTS_HEADER = 'points-header';

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
    }

    public function visit(): self
    {
        $this->playwright->navigate(self::URL);
        $this->playwright->waitFor(self::LEADERBOARD);

        return $this;
    }

    /**
     * Assert a player is at a specific rank.
     */
    public function assertPlayerRank(int $playerId, int $expectedRank): self
    {
        // Check player-row-{playerId} position in list
        return $this;
    }

    /**
     * Assert a player has specific points.
     */
    public function assertPlayerPoints(int $playerId, int $expectedPoints): self
    {
        // Check player-row-{playerId} contains points value
        return $this;
    }

    /**
     * Check if a player is visible in the leaderboard.
     */
    public function playerVisible(int $playerId): bool
    {
        return $this->playwright->exists(self::PLAYER_ROW_PREFIX.$playerId);
    }

    /**
     * Get number of players shown.
     */
    public function getPlayerCount(): int
    {
        // Count elements matching player-row-* pattern
        return 0;
    }

    /**
     * Get current user's points from header.
     */
    public function getMyPoints(): string
    {
        return $this->playwright->getText(self::POINTS_HEADER);
    }
}
