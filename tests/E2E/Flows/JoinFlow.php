<?php

namespace Tests\E2E\Flows;

use Tests\E2E\Pages\LobbyPage;
use Tests\E2E\Pages\WelcomePage;
use Tests\E2E\Support\PlaywrightHelper;

/**
 * Flow for joining a game via invite code.
 */
class JoinFlow
{
    private PlaywrightHelper $playwright;

    private WelcomePage $welcomePage;

    private LobbyPage $lobbyPage;

    public function __construct(PlaywrightHelper $playwright)
    {
        $this->playwright = $playwright;
        $this->welcomePage = new WelcomePage($playwright);
        $this->lobbyPage = new LobbyPage($playwright);
    }

    /**
     * Complete join flow: enter code -> click join -> wait for lobby.
     */
    public function joinGame(string $inviteCode): LobbyPage
    {
        $this->welcomePage
            ->visit()
            ->enterCode($inviteCode)
            ->clickJoin();

        $this->welcomePage->waitForLobbyRedirect();

        return $this->lobbyPage;
    }

    /**
     * Attempt to join with invalid code and assert error.
     */
    public function joinWithInvalidCode(string $code): WelcomePage
    {
        $this->welcomePage
            ->visit()
            ->enterCode($code)
            ->clickJoin();

        $this->welcomePage->assertInvalidCode();

        return $this->welcomePage;
    }
}
