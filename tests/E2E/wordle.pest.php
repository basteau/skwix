<?php

/**
 * Wordle E2E Tests
 *
 * Tests the Wordle gameplay including:
 * - Invalid word rejection
 * - 5-letter requirement
 * - All 6 attempts with minimum points
 * - Successful guess with correct points
 *
 * @group e2e
 */

use Tests\E2E\Fixtures\GameFactory;
use Tests\E2E\Support\E2EDatabase;
use Tests\E2E\Support\Time;

beforeEach(function () {
    Time::freeze();
    E2EDatabase::setup();

    // Create active game with known wordle word
    $this->fixture = GameFactory::createGame([
        'wordle_words' => ['SNEEUW', 'VORST', 'IJZEL'],
        'secret_word' => 'WINTER',
    ]);
    $this->game = $this->fixture['game'];
    $this->players = $this->fixture['players'];
});

afterEach(function () {
    Time::unfreeze();
});

test('invalid word shows error message and shakes row', function () {
    // Arrange: Login as player
    $player = $this->players[0];

    // Act: Visit wordle page, enter invalid 5-letter word, submit
    // Assert: Message "Ongeldig woord" appears
    // Assert: Row has shake animation class

    expect(true)->toBeTrue(); // Placeholder
})->skip('Requires Playwright MCP browser interaction');

test('word must be 5 letters to submit', function () {
    // Arrange: Login as player
    $player = $this->players[0];

    // Act: Type only 3 letters, try to submit
    // Assert: Message "Woord moet 5 letters zijn" appears
    // Assert: Cannot submit

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('all 6 attempts used gives minimum 3 points', function () {
    // Arrange: Login as player, configure wrong guesses
    $player = $this->players[0];
    $wrongWords = ['BLOEM', 'KAARS', 'TAFEL', 'HAMER', 'KAMER', 'WATER'];

    // Act: Make 6 wrong guesses (but valid words)
    // Assert: Wordle marked as completed
    // Assert: Player received 3 points (minimum)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('correct guess on first try gives 8 points', function () {
    // Arrange: Login as player, know the word is SNEEUW (day 1)
    $player = $this->players[0];

    // Act: Guess SNEEUW on first try
    // Assert: All tiles show correct (green)
    // Assert: Message shows "+8 punten"
    // Assert: Player points increased by 8

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('correct guess on third try gives 6 points', function () {
    // Arrange: Login as player
    $player = $this->players[0];

    // Act: Two wrong guesses, then correct
    // Assert: Player receives 6 points (8 - (2-1)*1 = 6... or configured formula)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('tile colors reflect letter status correctly', function () {
    // Arrange: Word is SNEEUW, guess SLEEP
    // S is correct (green)
    // L is absent (gray)
    // E is correct position (green)
    // E is present but wrong position (yellow)
    // P is absent (gray)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('keyboard shows used letter states', function () {
    // Arrange: Make a guess
    // Assert: Keyboard keys update to show correct/present/absent

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('wordle not available before 8:00', function () {
    // Arrange: Set time to 7:30
    Time::beforeWordleUnlock();

    // Act: Visit wordle page
    // Assert: Shows "Wordle beschikbaar om 8:00" message

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('completed wordle shows points earned', function () {
    // Arrange: Complete a wordle
    // Act: Revisit wordle page
    // Assert: Shows "+X punten verdiend!" and "Morgen weer een nieuwe"

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');
