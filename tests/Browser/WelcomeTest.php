<?php

/**
 * Welcome Page Browser Tests
 *
 * Tests the welcome/landing page functionality including:
 * - Page loads correctly
 * - Invite code input works
 * - Invalid code shows error
 * - Valid code redirects to game
 *
 * @group e2e
 */

use App\Models\User;

test('welcome page loads and displays title', function () {
    visit('/welcome')
        ->assertSee('Skwix')
        ->assertSee('Raad maar raak!');
});

test('can enter invite code in input fields', function () {
    visit('/welcome')
        ->type('[data-testid="invite-code-input"]', 'ABC123')
        ->assertSee('Doe mee');
});

test('invalid invite code shows error message', function () {
    visit('/welcome')
        ->type('[data-testid="invite-code-input"]', 'WRONG1')
        ->press('[data-testid="join-game-button"]')
        ->waitForText('Code ongeldig')
        ->assertSee('Code ongeldig');
});

test('valid invite code redirects to wordle', function () {
    $user = User::factory()->create([
        'code' => 'TEST12',
    ]);

    visit('/welcome')
        ->type('[data-testid="invite-code-input"]', 'TEST12')
        ->press('[data-testid="join-game-button"]')
        ->waitForNavigation()
        ->assertPathIs('/play/wordle');
});

test('resend code modal opens when clicking link', function () {
    visit('/welcome')
        ->press('[data-testid="resend-code-trigger"]')
        ->waitForText('Code opnieuw versturen')
        ->assertSee('E-mailadres');
});

test('join button is disabled when code is incomplete', function () {
    visit('/welcome')
        ->type('[data-testid="invite-code-input"]', 'ABC')
        ->assertAttribute('[data-testid="join-game-button"]', 'disabled', 'true');
});
