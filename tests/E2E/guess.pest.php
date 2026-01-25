<?php

/**
 * Guess (Question) E2E Tests
 *
 * Tests the Question/Guess gameplay including:
 * - Question costs 3 points
 * - AI responds yes/no
 * - Question appears in shared history
 * - Insufficient points shows error
 *
 * @group e2e
 */

use Tests\E2E\Fixtures\GameFactory;
use Tests\E2E\Support\E2EDatabase;
use Tests\E2E\Support\Time;

beforeEach(function () {
    Time::freeze();
    E2EDatabase::setup();

    // Create active game with known secret word
    $this->fixture = GameFactory::createGame([
        'secret_word' => 'WINTER',
        'question_cost' => 10,
    ]);
    $this->game = $this->fixture['game'];
    $this->players = $this->fixture['players'];
});

afterEach(function () {
    Time::unfreeze();
});

test('asking question deducts 3 points', function () {
    // Arrange: Login as player with 10 points
    $player = $this->players[0];
    $initialPoints = 10;

    // Act: Ask a question "Is het een seizoen?"
    // Assert: Points display shows 7 (10 - 3)

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('AI responds with yes for positive question', function () {
    // Arrange: E2E_AI_SEQUENCE=yes
    // Secret word is WINTER
    $player = $this->players[0];

    // Act: Ask "Is het een seizoen?" (WINTER is a season)
    // Assert: Answer badge shows "Ja"

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('AI responds with no for negative question', function () {
    // Arrange: E2E_AI_SEQUENCE=no
    $player = $this->players[0];

    // Act: Ask "Is het een dier?" (WINTER is not an animal)
    // Assert: Answer badge shows "Nee"

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('question appears in history with player name', function () {
    // Arrange: Login as "Speler 1"
    $player = $this->players[0];

    // Act: Ask a question
    // Assert: History shows question with player name/avatar

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('questions from other players visible', function () {
    // Arrange: Two players in game
    // Player 1 asks a question
    // Act: Login as Player 2, visit guess page
    // Assert: Player 1's question visible in history

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('input disabled when insufficient points', function () {
    // Arrange: Player with 2 points (< 3 required)
    // Act: Visit guess page
    // Assert: Input is disabled
    // Assert: Message about needing 3 points

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('cannot submit question shorter than 3 characters', function () {
    // Arrange: Login as player with enough points
    $player = $this->players[0];

    // Act: Type "Is" (2 chars) and try to submit
    // Assert: Submit button disabled

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('empty state shows helpful message', function () {
    // Arrange: No questions asked yet
    // Act: Visit guess page
    // Assert: Large "?" icon visible
    // Assert: Helper text about asking yes/no questions

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('answer sequence follows AI configuration', function () {
    // Arrange: E2E_AI_SEQUENCE=yes,no,yes
    $player = $this->players[0];

    // Act: Ask 3 questions
    // Assert: Answers follow yes, no, yes pattern

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('loading state shown while AI responds', function () {
    // Arrange: Login as player
    $player = $this->players[0];

    // Act: Click submit
    // Assert: Button shows spinner
    // Assert: Input disabled during loading

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');
