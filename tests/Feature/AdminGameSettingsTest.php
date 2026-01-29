<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Carbon\Carbon;

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

it('reduces player cooldowns when shortening cooldown hours', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-29 12:00:00'));

    $game = Game::factory()->active()->create([
        'cooldown_hours' => 12,
        'wordle_interval_hours' => 24,
    ]);

    // Player started cooldown 2 hours ago with 12h cooldown -> ends at 22:00 (10h from now)
    $player = Player::factory()->for($game)->create([
        'last_guess_at' => Carbon::parse('2026-01-29 10:00:00'),
        'cooldown_ends_at' => Carbon::parse('2026-01-29 22:00:00'),
    ]);

    // Reduce cooldown to 6 hours (would end 6 hours from last_guess_at = 16:00 = 4h from now)
    $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 6,
            'wordle_interval_hours' => 24,
        ]);

    $player->refresh();

    // New cooldown_ends_at should be last_guess_at + 6 hours = 16:00
    expect($player->cooldown_ends_at->format('H:i'))->toBe('16:00');

    Carbon::setTestNow();
});

it('does not extend player cooldowns when lengthening cooldown hours', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-29 12:00:00'));

    $game = Game::factory()->active()->create([
        'cooldown_hours' => 4,
        'wordle_interval_hours' => 24,
    ]);

    // Player started cooldown 2 hours ago with 4h cooldown -> ends at 14:00 (2h from now)
    $originalCooldownEndsAt = Carbon::parse('2026-01-29 14:00:00');
    $player = Player::factory()->for($game)->create([
        'last_guess_at' => Carbon::parse('2026-01-29 10:00:00'),
        'cooldown_ends_at' => $originalCooldownEndsAt,
    ]);

    // Increase cooldown to 12 hours (would end 12 hours from last_guess_at = 22:00)
    $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 12,
            'wordle_interval_hours' => 24,
        ]);

    $player->refresh();

    // Cooldown should NOT be extended - keep original 14:00
    expect($player->cooldown_ends_at->format('Y-m-d H:i:s'))->toBe('2026-01-29 14:00:00');

    Carbon::setTestNow();
});

it('reduces next_wordle_at when shortening wordle interval', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-29 14:00:00', 'Europe/Brussels'));

    $game = Game::factory()->active()->create([
        'starts_at' => Carbon::parse('2026-01-28 08:00:00', 'Europe/Brussels'),
        'wordle_hour' => 8,
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 24,
        'next_wordle_at' => Carbon::parse('2026-01-30 08:00:00', 'Europe/Brussels'), // Tomorrow 8am
    ]);

    // Reduce interval to 8 hours (next wordle would be today at 16:00)
    $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 8,
            'wordle_interval_hours' => 8,
        ]);

    $game->refresh();

    // Next wordle should be reduced from tomorrow 8am to today 16:00
    expect($game->next_wordle_at->lt(Carbon::parse('2026-01-30 08:00:00', 'Europe/Brussels')))->toBeTrue();

    Carbon::setTestNow();
});

it('does not extend next_wordle_at when lengthening wordle interval', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-29 14:00:00', 'Europe/Brussels'));

    $originalNextWordle = Carbon::parse('2026-01-29 16:00:00', 'Europe/Brussels');
    $game = Game::factory()->active()->create([
        'starts_at' => Carbon::parse('2026-01-28 08:00:00', 'Europe/Brussels'),
        'wordle_hour' => 8,
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 8,
        'next_wordle_at' => $originalNextWordle, // Today at 16:00
    ]);

    // Increase interval to 24 hours (would push next wordle to tomorrow)
    $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 8,
            'wordle_interval_hours' => 24,
        ]);

    $game->refresh();

    // Next wordle should NOT be extended - keep original 16:00 today
    expect($game->next_wordle_at->eq($originalNextWordle))->toBeTrue();

    Carbon::setTestNow();
});

it('initializes next_wordle_at for existing games without it', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-29 14:00:00', 'Europe/Brussels'));

    // Simulate existing game without next_wordle_at (before migration)
    $game = Game::factory()->active()->create([
        'starts_at' => Carbon::parse('2026-01-28 08:00:00', 'Europe/Brussels'),
        'wordle_hour' => 8,
        'cooldown_hours' => 8,
        'wordle_interval_hours' => 24,
        'next_wordle_at' => null, // Not set - existing game
    ]);

    expect($game->next_wordle_at)->toBeNull();

    // Admin updates settings
    $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/settings", [
            'cooldown_hours' => 8,
            'wordle_interval_hours' => 12,
        ]);

    $game->refresh();

    // next_wordle_at should now be initialized
    expect($game->next_wordle_at)->not->toBeNull();
    // Should be last unlock (Jan 29 08:00) + 12 hours = Jan 29 20:00
    expect($game->next_wordle_at->format('Y-m-d H:i'))->toBe('2026-01-29 20:00');

    Carbon::setTestNow();
});
