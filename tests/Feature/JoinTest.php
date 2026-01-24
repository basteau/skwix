<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('POST /join', function () {
    it('validates and logs in player with valid invite code for active game', function () {
        $game = Game::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['email' => 'player@test.com']);
        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player@test.com',
            'invite_code' => 'ABC123',
            'joined_at' => null,
        ]);

        $response = $this->postJson('/join', ['code' => 'abc123']);

        $response->assertOk()
            ->assertJsonStructure([
                'player' => ['id', 'name', 'points'],
                'game' => ['id', 'status'],
            ]);

        $this->assertAuthenticated();
        expect($player->fresh()->joined_at)->not->toBeNull();
    });

    it('validates and logs in player with valid invite code for pending game', function () {
        $game = Game::factory()->create(['status' => 'pending']);
        $user = User::factory()->create(['email' => 'player@test.com']);
        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player@test.com',
            'invite_code' => 'ABC123',
        ]);

        $response = $this->postJson('/join', ['code' => 'ABC123']);

        $response->assertOk();
        $this->assertAuthenticated();
    });

    it('returns 422 for invalid invite code', function () {
        $response = $this->postJson('/join', ['code' => 'INVALID']);

        $response->assertStatus(422)
            ->assertJson(['message' => 'Code ongeldig of spel niet actief']);
    });

    it('returns 422 for completed game', function () {
        $game = Game::factory()->create(['status' => 'completed']);
        $user = User::factory()->create(['email' => 'player@test.com']);
        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player@test.com',
            'invite_code' => 'ABC123',
        ]);

        $response = $this->postJson('/join', ['code' => 'ABC123']);

        $response->assertStatus(422);
    });

    it('is idempotent for already joined player', function () {
        $game = Game::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['email' => 'player@test.com']);
        $joinedAt = now()->subDay();
        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player@test.com',
            'invite_code' => 'ABC123',
            'joined_at' => $joinedAt,
        ]);

        $response = $this->postJson('/join', ['code' => 'ABC123']);

        $response->assertOk();
        $this->assertAuthenticated();
        expect($player->fresh()->joined_at->toDateTimeString())
            ->toBe($joinedAt->toDateTimeString());
    });

    it('validates code is required', function () {
        $response = $this->postJson('/join', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    });

    it('handles case insensitive codes', function () {
        $game = Game::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['email' => 'player@test.com']);
        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player@test.com',
            'invite_code' => 'ABC123',
        ]);

        $response = $this->postJson('/join', ['code' => 'abc123']);

        $response->assertOk();
    });
});
