<?php

/**
 * Full Game Lose E2E Test
 *
 * Losing game flow:
 * 1. Two players in game
 * 2. Player A wins (guesses secret word)
 * 3. Player B sees /lose page with winner name and secret word
 *
 * @group e2e
 */

use Tests\E2E\Fixtures\GameFactory;
use Tests\E2E\Support\E2EDatabase;
use Tests\E2E\Support\Time;

beforeEach(function () {
    Time::afterWordleUnlock();
    E2EDatabase::setup();

    // Create active game
    $this->game = GameFactory::active([
        'invite_code' => 'LOSER24',
        'wordle_words' => ['SNEEUW'],
        'secret_word' => 'WINTER',
    ]);

    // Create two players
    $this->playerA = GameFactory::player($this->game, [
        'name' => 'Winner Player',
        'points' => 20,
    ]);

    $this->playerB = GameFactory::player($this->game, [
        'name' => 'Losing Player',
        'points' => 15,
    ]);
});

afterEach(function () {
    Time::unfreeze();
});

test('losing player sees lose page when another wins', function () {
    // This test represents the losing path:
    //
    // 1. Player A and B both join the game
    // 2. Player A guesses the secret word "WINTER" correctly
    // 3. Game ends with Player A as winner
    // 4. Player B is redirected to /lose
    // 5. Lose page shows:
    //    - "Goed gespeeld!" title
    //    - Player's rank (e.g., #2 of 2)
    //    - Secret word "WINTER" revealed
    //    - Winner name "Winner Player"

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('lose page displays winner information', function () {
    // Arrange: Game completed, Player A won
    // Act: Login as Player B, visit /lose
    // Assert: Winner name "Winner Player" shown
    // Assert: Secret word "WINTER" revealed

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('lose page shows player rank', function () {
    // Arrange: Player B finishes in 2nd place
    // Act: On /lose page
    // Assert: Shows "Je eindigde op plek 2 van 2 spelers"

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('lose page shows player final points', function () {
    // Arrange: Player B has 15 points at game end
    // Act: On /lose page
    // Assert: Shows "Jouw eindscore: 15 punten"

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('lose page has return to start button', function () {
    // Arrange: On /lose page
    // Act: Click "Terug naar start" button
    // Assert: Redirected to home/welcome

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('losing player does not see QR code', function () {
    // Arrange: On /lose page
    // Assert: No QR code element present
    // (QR is only for winners)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');
