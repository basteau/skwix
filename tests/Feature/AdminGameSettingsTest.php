<?php

use App\Models\Game;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['is_admin' => true]);
});

it('allows game settings updates for draft games', function () {
    $game = Game::factory()->create([
        'status' => 'draft',
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 24,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 12,
            'wordle_interval_hours' => 8,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    $game->refresh();
    expect($game->cooldown_hours)->toBe(12);
    expect($game->wordle_interval_hours)->toBe(8);
});

it('allows game settings updates for pending games', function () {
    $game = Game::factory()->create([
        'status' => 'pending',
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 24,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 6,
            'wordle_interval_hours' => 12,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    $game->refresh();
    expect($game->cooldown_hours)->toBe(6);
    expect($game->wordle_interval_hours)->toBe(12);
});

it('allows game settings updates for active games', function () {
    $game = Game::factory()->active()->create([
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 24,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 4,
            'wordle_interval_hours' => 8,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    $game->refresh();
    expect($game->cooldown_hours)->toBe(4);
    expect($game->wordle_interval_hours)->toBe(8);
});

it('rejects game settings updates for completed games', function () {
    $game = Game::factory()->completed()->create([
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 24,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 12,
            'wordle_interval_hours' => 12,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error');

    $game->refresh();
    expect($game->cooldown_hours)->toBe(8);
    expect($game->wordle_interval_hours)->toBe(24);
});

it('validates cooldown_hours values', function () {
    $game = Game::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 3,
            'wordle_interval_hours' => 24,
        ]);

    $response->assertSessionHasErrors('cooldown_hours');
});

it('validates wordle_interval_hours values', function () {
    $game = Game::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 8,
            'wordle_interval_hours' => 6,
        ]);

    $response->assertSessionHasErrors('wordle_interval_hours');
});

it('requires admin authentication', function () {
    $user = User::factory()->create(['is_admin' => false]);
    $game = Game::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 12,
            'wordle_interval_hours' => 12,
        ]);

    $response->assertForbidden();
});
