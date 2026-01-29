<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->game = Game::factory()->active()->create();
    $this->player = Player::factory()->for($this->game)->create([
        'email' => $this->user->email,
        'points' => 100,
        'last_guess_at' => null,
        'cooldown_ends_at' => null,
    ]);

    Http::fake([
        'https://openrouter.ai/*' => Http::response([
            'choices' => [['message' => ['content' => '{"type": "property"}']]],
        ]),
    ]);
});

it('allows asking question when no previous guess', function () {
    expect($this->player->isOnCooldown())->toBeFalse();
    expect($this->player->getCooldownRemainingSeconds())->toBe(0);
    expect($this->player->getCooldownEndsAt())->toBeNull();
});

it('blocks question when cooldown is active', function () {
    $cooldownHours = $this->game->cooldown_hours ?? config('game.guess_cooldown_hours', 8);
    $this->player->update([
        'last_guess_at' => now()->subHours(2),
        'cooldown_ends_at' => now()->subHours(2)->addHours($cooldownHours),
    ]);
    $this->player->refresh();

    expect($this->player->isOnCooldown())->toBeTrue();
    expect($this->player->getCooldownRemainingSeconds())->toBeGreaterThan(0);
    expect($this->player->getCooldownEndsAt())->not->toBeNull();

    $response = $this->actingAs($this->user)
        ->postJson('/play/guess/ask', ['question' => 'Is it red?']);

    $response->assertStatus(429);
    $response->assertJson(['error' => 'cooldown_active']);
    $response->assertJsonStructure(['cooldown_remaining', 'cooldown_ends_at']);
});

it('allows question after cooldown expires', function () {
    $cooldownHours = config('game.guess_cooldown_hours', 8);
    $this->player->update([
        'last_guess_at' => now()->subHours($cooldownHours + 1),
        'cooldown_ends_at' => now()->subHours(1), // Already expired
    ]);

    expect($this->player->isOnCooldown())->toBeFalse();
    expect($this->player->getCooldownRemainingSeconds())->toBe(0);
    expect($this->player->getCooldownEndsAt())->toBeNull();
});

it('calculates cooldown remaining seconds correctly', function () {
    Carbon::setTestNow(now());

    $cooldownHours = $this->game->cooldown_hours ?? config('game.guess_cooldown_hours', 8);
    $this->player->update([
        'last_guess_at' => now()->subHours(4),
        'cooldown_ends_at' => now()->subHours(4)->addHours($cooldownHours),
    ]);

    $expectedRemaining = ($cooldownHours - 4) * 3600;

    $remaining = $this->player->getCooldownRemainingSeconds();

    expect($remaining)->toBeGreaterThan($expectedRemaining - 60);
    expect($remaining)->toBeLessThanOrEqual($expectedRemaining);

    Carbon::setTestNow();
});

it('returns cooldown info in show endpoint', function () {
    $cooldownHours = $this->game->cooldown_hours ?? config('game.guess_cooldown_hours', 8);
    $this->player->update([
        'last_guess_at' => now()->subHours(2),
        'cooldown_ends_at' => now()->subHours(2)->addHours($cooldownHours),
    ]);

    $response = $this->actingAs($this->user)->get('/play/guess');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('player.cooldown_remaining', fn ($value) => $value > 0)
        ->has('player.cooldown_ends_at')
    );
});
