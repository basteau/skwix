<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use App\Models\WordleAttempt;
use App\Services\WordleService;
use Carbon\Carbon;

beforeEach(function () {
    $this->wordleService = new WordleService;
});

describe('WordleService', function () {
    it('evaluates a correct guess', function () {
        $result = $this->wordleService->evaluateGuess('woord', 'woord');

        expect($result)->toHaveCount(5);
        foreach ($result as $letter) {
            expect($letter['status'])->toBe('correct');
        }
    });

    it('evaluates present letters', function () {
        // Target: 'woord' = w,o,o,r,d
        // Guess:  'drown' = d,r,o,w,n
        $result = $this->wordleService->evaluateGuess('drown', 'woord');

        expect($result[0]['status'])->toBe('present'); // d is in word, wrong pos
        expect($result[1]['status'])->toBe('present'); // r is in word, wrong pos
        expect($result[2]['status'])->toBe('correct'); // o is correct position
        expect($result[3]['status'])->toBe('present'); // w is in word, wrong pos
        expect($result[4]['status'])->toBe('absent');  // n is not in word
    });

    it('evaluates absent letters', function () {
        $result = $this->wordleService->evaluateGuess('xxxxx', 'woord');

        foreach ($result as $letter) {
            expect($letter['status'])->toBe('absent');
        }
    });

    it('calculates points correctly with new economy', function () {
        // New point system: tied to guess cost (10 pts) using multipliers
        expect($this->wordleService->calculatePoints(1, true))->toBe(20);  // 2.0x
        expect($this->wordleService->calculatePoints(2, true))->toBe(17);  // 1.7x
        expect($this->wordleService->calculatePoints(3, true))->toBe(15);  // 1.5x
        expect($this->wordleService->calculatePoints(4, true))->toBe(14);  // 1.4x
        expect($this->wordleService->calculatePoints(5, true))->toBe(12);  // 1.2x
        expect($this->wordleService->calculatePoints(6, true))->toBe(10);  // 1.0x
        expect($this->wordleService->calculatePoints(6, false))->toBe(7);  // failed = 0.7x
    });
});

describe('Wordle Controller', function () {
    it('shows wordle page for authenticated user with active game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
            'wordle_words' => ['woord', 'appel'],
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 10,
        ]);

        $response = $this->actingAs($user)->get('/play/wordle');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/wordle')
            ->has('player')
            ->has('game')
            ->has('wordle')
            ->where('player.points', 10)
            ->where('wordle.available', true)
            ->where('wordle.completed', false)
        );

        Carbon::setTestNow();
    });

    it('allows submitting a guess', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
            'wordle_words' => ['woord', 'appel'],
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 0,
        ]);

        $response = $this->actingAs($user)->postJson('/play/wordle/guess', [
            'guess' => 'appel',
        ]);

        $response->assertOk();
        $response->assertJson([
            'correct' => true,
            'completed' => true,
            'points_earned' => 20, // 1 guess = 2.0x multiplier of guess_cost
        ]);

        // Verify database updated
        $this->assertDatabaseHas('wordle_attempts', [
            'game_id' => $game->id,
            'player_id' => $player->id,
            'completed' => true,
            'points_earned' => 20,
        ]);

        // Verify player points updated
        expect($player->fresh()->points)->toBe(20);

        Carbon::setTestNow();
    });

    it('awards 17 points for solving in 2 guesses', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
            'wordle_words' => ['woord', 'appel'],
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 0,
        ]);

        // First guess (wrong)
        $response = $this->actingAs($user)->postJson('/play/wordle/guess', [
            'guess' => 'woord',
        ]);
        $response->assertOk();
        $response->assertJson(['correct' => false, 'completed' => false]);

        // Second guess (correct)
        $response = $this->actingAs($user)->postJson('/play/wordle/guess', [
            'guess' => 'appel',
        ]);

        $response->assertOk();
        $response->assertJson([
            'correct' => true,
            'completed' => true,
            'points_earned' => 17, // 2 guesses = 1.7x multiplier
        ]);

        expect($player->fresh()->points)->toBe(17);

        Carbon::setTestNow();
    });

    it('rejects invalid words not in wordlist', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
            'wordle_words' => ['woord', 'appel'],
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
        ]);

        $response = $this->actingAs($user)->postJson('/play/wordle/guess', [
            'guess' => 'xxxxx',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['message' => 'Ongeldig woord']);

        Carbon::setTestNow();
    });

    it('rejects guess when wordle already completed', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
            'wordle_words' => ['woord', 'appel'],
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
        ]);

        WordleAttempt::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'day_number' => 2,
            'guesses' => [['word' => 'appel', 'result' => []]],
            'completed' => true,
            'points_earned' => 20,
        ]);

        $response = $this->actingAs($user)->postJson('/play/wordle/guess', [
            'guess' => 'woord',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'already_completed']);

        Carbon::setTestNow();
    });
});
