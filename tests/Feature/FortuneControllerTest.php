<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\SpinResult;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));
});

afterEach(function () {
    Carbon::setTestNow();
});

describe('FortuneController show', function () {
    it('shows fortune page for authenticated user with active game', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/fortune');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/fortune')
            ->has('player')
            ->has('game')
            ->where('player.points', 50)
            ->where('game.status', 'active')
        );
    });

    it('shows recent spins', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
        ]);

        SpinResult::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'amount_wagered' => 10,
            'won' => true,
            'points_change' => 10,
        ]);

        $response = $this->actingAs($user)->get('/play/fortune');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('recentSpins', 1)
            ->where('recentSpins.0.won', true)
            ->where('recentSpins.0.amount', 10)
        );
    });

    it('returns error when no active game', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->actingAs($user)->get('/play/fortune');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/fortune')
            ->has('error')
        );
    });
});

describe('FortuneController spin', function () {
    it('allows spinning with sufficient points', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(1),
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'won',
            'points_change',
            'points_remaining',
            'spin_degrees',
            'spin_result',
        ]);

        $this->assertDatabaseHas('spin_results', [
            'game_id' => $game->id,
            'player_id' => $player->id,
            'amount_wagered' => 10,
        ]);
    });

    it('rejects spin with insufficient points', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 5,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'insufficient_points']);
    });

    it('rejects spin when game is completed', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'completed']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('rejects spin when game is pending', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'pending']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('rejects spin without active game', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('updates player points after winning spin', function () {
        config(['e2e.fortune_driver' => 'fake']);
        app()->singleton(\App\Services\FakeFortuneService::class, function () {
            return new class
            {
                public function spin(): bool
                {
                    return true; // Always win
                }
            };
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertOk();
        $response->assertJson([
            'won' => true,
            'points_change' => 10,
            'points_remaining' => 60,
        ]);

        expect($player->fresh()->points)->toBe(60);
    });

    it('updates player points after losing spin', function () {
        config(['e2e.fortune_driver' => 'fake']);
        app()->singleton(\App\Services\FakeFortuneService::class, function () {
            return new class
            {
                public function spin(): bool
                {
                    return false; // Always lose
                }
            };
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertOk();
        $response->assertJson([
            'won' => false,
            'points_change' => -10,
            'points_remaining' => 40,
        ]);

        expect($player->fresh()->points)->toBe(40);
    });

    it('validates wager is required', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', []);

        $response->assertStatus(422);
    });

    it('validates wager is at least 1', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 0,
        ]);

        $response->assertStatus(422);
    });

    it('prevents points from going negative when losing', function () {
        config(['e2e.fortune_driver' => 'fake']);
        app()->singleton(\App\Services\FakeFortuneService::class, function () {
            return new class
            {
                public function spin(): bool
                {
                    return false;
                }
            };
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 10,
        ]);

        $response = $this->actingAs($user)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertOk();
        $response->assertJson([
            'won' => false,
            'points_change' => -10,
            'points_remaining' => 0,
        ]);

        expect($player->fresh()->points)->toBe(0);
    });
});
