<?php

/**
 * Full Game Win E2E Test
 *
 * Complete winning game flow:
 * 1. Player joins via invite code
 * 2. Completes wordle
 * 3. Asks question
 * 4. Spins wheel (forced win)
 * 5. Guesses secret word correctly
 * 6. Sees /win page with QR code
 *
 * @group e2e
 */

use Tests\E2E\Fixtures\GameFactory;
use Tests\E2E\Support\E2EDatabase;
use Tests\E2E\Support\Time;

beforeEach(function () {
    Time::afterWordleUnlock(); // 9:00 AM
    E2EDatabase::setup();

    // Create active game with known words
    $this->game = GameFactory::active([
        'invite_code' => 'WINTER24',
        'wordle_words' => ['SNEEUW', 'VORST', 'IJZEL'],
        'secret_word' => 'WINTER',
        'question_cost' => 3,
        'correct_wordle_points' => 5,
    ]);
});

afterEach(function () {
    Time::unfreeze();
});

test('complete winning game flow', function () {
    // This test represents the full happy path:
    //
    // 1. Navigate to /welcome
    // 2. Enter invite code "WINTER24"
    // 3. Click "Doe mee"
    // 4. Wait for redirect to /lobby
    // 5. Wait for countdown to reach 0 (or game to activate)
    // 6. Navigate to /wordle
    // 7. Guess "SNEEUW" (day 1 word)
    // 8. See success message with points
    // 9. Navigate to /guess
    // 10. Ask "Is het een seizoen?"
    // 11. See answer (yes from fake AI)
    // 12. Navigate to /fortune
    // 13. Wager 5 points
    // 14. Spin wheel (forced win)
    // 15. See +5 result
    // 16. [Trigger game win via guessing secret word]
    // 17. Redirected to /win
    // 18. Assert winner name displayed
    // 19. Assert secret word "WINTER" revealed
    // 20. Assert QR code for prize visible

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('win page displays correct winner information', function () {
    // Arrange: Complete game as winner
    // Act: Land on /win page
    // Assert: Title "🏆 GEWONNEN! 🏆" visible
    // Assert: Winner avatar and name displayed
    // Assert: Secret word revealed
    // Assert: Points shown

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('QR code links to prize redemption', function () {
    // Arrange: Win the game
    // Act: On /win page
    // Assert: QR code element exists
    // Assert: QR contains valid prize URL

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');

test('confetti animation plays on win', function () {
    // Arrange: Win the game
    // Act: Land on /win page
    // Assert: Confetti elements animated
    // Assert: Confetti stops after ~5 seconds

    expect(true)->toBeTrue();
})->skip('Requires Playwright MCP browser interaction');
