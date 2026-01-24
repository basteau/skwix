<?php

use App\Models\Game;
use App\Models\Player;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('game:end-expired command', function () {
    it('ends expired games and selects winners', function () {
        $game = Game::factory()->create([
            'status' => 'active',
            'ends_at' => now()->subHour(),
        ]);

        $winner = Player::factory()->create(['game_id' => $game->id, 'name' => 'TopPlayer', 'points' => 100]);
        Player::factory()->create(['game_id' => $game->id, 'points' => 50]);

        $this->artisan('game:end-expired')
            ->assertSuccessful();

        $game->refresh();
        expect($game->status)->toBe('completed');
        expect($game->winner_id)->toBe($winner->id);
    });

    it('outputs message when no expired games', function () {
        $this->artisan('game:end-expired')
            ->expectsOutputToContain('No expired games to end')
            ->assertSuccessful();
    });

    it('handles tied games with no winner', function () {
        $game = Game::factory()->create([
            'status' => 'active',
            'ends_at' => now()->subHour(),
        ]);

        Player::factory()->create(['game_id' => $game->id, 'points' => 100]);
        Player::factory()->create(['game_id' => $game->id, 'points' => 100]);

        $this->artisan('game:end-expired')
            ->expectsOutputToContain('No winner (tie or no players)')
            ->assertSuccessful();

        $game->refresh();
        expect($game->status)->toBe('completed');
        expect($game->winner_id)->toBeNull();
    });
});
