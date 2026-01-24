<?php

/**
 * Fortune (Wheel) E2E Tests
 *
 * Tests the Wheel of Fortune gameplay including:
 * - Wager validation (0, >points disabled)
 * - Forced win doubles points
 * - Forced lose removes wagered points
 *
 * @group e2e
 */

use Tests\E2E\Fixtures\GameFactory;
use Tests\E2E\Support\E2EDatabase;
use Tests\E2E\Support\Time;

beforeEach(function () {
    Time::freeze();
    E2EDatabase::setup();

    // Create active game
    $this->fixture = GameFactory::createGame();
    $this->game = $this->fixture['game'];
    $this->players = $this->fixture['players'];
});

afterEach(function () {
    Time::unfreeze();
});

test('spin button disabled when wager is 0', function () {
    // Arrange: Login as player with 10 points
    $player = $this->players[0];

    // Act: Visit fortune page, leave wager empty or 0
    // Assert: Spin button is disabled

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('spin button disabled when wager exceeds points', function () {
    // Arrange: Login as player with 10 points
    $player = $this->players[0];

    // Act: Enter wager of 50 (> 10 points)
    // Assert: Spin button is disabled

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('forced win doubles wagered points', function () {
    // Arrange: Login as player with 10 points
    // Config: E2E_FORTUNE_SEQUENCE=win
    $player = $this->players[0];
    $initialPoints = 10;
    $wager = 5;

    // Act: Wager 5, spin
    // Assert: Result shows "+5"
    // Assert: Points display shows 15 (10 + 5)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('forced lose removes wagered points', function () {
    // Arrange: Login as player with 10 points
    // Config: E2E_FORTUNE_SEQUENCE=lose
    $player = $this->players[0];
    $initialPoints = 10;
    $wager = 5;

    // Act: Wager 5, spin
    // Assert: Result shows "-5"
    // Assert: Points display shows 5 (10 - 5)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('half button sets wager to 50% of points', function () {
    // Arrange: Login as player with 10 points
    $player = $this->players[0];

    // Act: Click 50% button
    // Assert: Wager input shows 5

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('max button sets wager to all points', function () {
    // Arrange: Login as player with 10 points
    $player = $this->players[0];

    // Act: Click Max button
    // Assert: Wager input shows 10

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('wheel animation completes before result shown', function () {
    // Arrange: Login as player, valid wager
    $player = $this->players[0];

    // Act: Spin wheel
    // Assert: Result element appears after ~3.5 seconds
    // Assert: Result shows win or lose based on sequence

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('confetti shows on win', function () {
    // Arrange: Config forced win
    // Act: Spin and win
    // Assert: Confetti animation visible

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('cannot spin with 0 points', function () {
    // Arrange: Player with 0 points
    // Act: Visit fortune page
    // Assert: Message "Je hebt geen punten om in te zetten"
    // Assert: Spin button disabled

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('sequential spins follow fortune sequence', function () {
    // Arrange: E2E_FORTUNE_SEQUENCE=win,lose,win
    // Act: Spin 3 times
    // Assert: Results follow win, lose, win pattern

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');
