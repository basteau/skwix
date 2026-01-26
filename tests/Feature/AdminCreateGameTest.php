<?php

use App\Models\User;
use App\Services\WordlistService;

beforeEach(function () {
    $this->admin = User::factory()->create(['is_admin' => true]);
    $this->wordlist = app(WordlistService::class)->getRandomWords(6);
});

it('rejects duplicate emails in player list', function () {
    $response = $this->actingAs($this->admin)
        ->post('/admin/create', [
            'secret_word' => 'geheim',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'duration_days' => 6,
            'wordle_hour' => 8,
            'wordle_words' => $this->wordlist,
            'players' => [
                ['name' => 'John', 'email' => 'john@example.com', 'avatar' => null],
                ['name' => 'Johnny', 'email' => 'john@example.com', 'avatar' => null],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('players');
});

it('rejects duplicate emails case-insensitively', function () {
    $response = $this->actingAs($this->admin)
        ->post('/admin/create', [
            'secret_word' => 'geheim',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'duration_days' => 6,
            'wordle_hour' => 8,
            'wordle_words' => $this->wordlist,
            'players' => [
                ['name' => 'John', 'email' => 'JOHN@example.com', 'avatar' => null],
                ['name' => 'Johnny', 'email' => 'john@example.com', 'avatar' => null],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('players');
});

it('allows unique emails in player list', function () {
    $response = $this->actingAs($this->admin)
        ->post('/admin/create', [
            'secret_word' => 'geheim',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'duration_days' => 6,
            'wordle_hour' => 8,
            'wordle_words' => $this->wordlist,
            'players' => [
                ['name' => 'John', 'email' => 'john@example.com', 'avatar' => null],
                ['name' => 'Jane', 'email' => 'jane@example.com', 'avatar' => null],
            ],
        ]);

    $response->assertRedirect('/admin');
    $response->assertSessionHas('success');
});

it('creates players with starting points', function () {
    $response = $this->actingAs($this->admin)
        ->post('/admin/create', [
            'secret_word' => 'geheim',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'wordle_hour' => 8,
            'starting_points' => 100,
            'players' => [
                ['name' => 'John', 'email' => 'john@example.com'],
                ['name' => 'Jane', 'email' => 'jane@example.com'],
            ],
        ]);

    $response->assertRedirect('/admin');

    $game = \App\Models\Game::latest()->first();
    expect($game->starting_points)->toBe(100);
    expect($game->players)->each(fn ($player) => $player->points->toBe(100));
});

it('defaults starting points to zero when not provided', function () {
    $response = $this->actingAs($this->admin)
        ->post('/admin/create', [
            'secret_word' => 'geheim',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'wordle_hour' => 8,
            'players' => [
                ['name' => 'John', 'email' => 'john@example.com'],
                ['name' => 'Jane', 'email' => 'jane@example.com'],
            ],
        ]);

    $response->assertRedirect('/admin');

    $game = \App\Models\Game::latest()->first();
    expect($game->starting_points)->toBe(0);
    expect($game->players)->each(fn ($player) => $player->points->toBe(0));
});

it('gives starting points to players with existing user accounts', function () {
    // Create existing user
    User::factory()->create([
        'email' => 'existing@example.com',
        'name' => 'Existing User',
    ]);

    $response = $this->actingAs($this->admin)
        ->post('/admin/create', [
            'secret_word' => 'geheim',
            'starts_at' => now()->addDay()->toDateTimeString(),
            'wordle_hour' => 8,
            'starting_points' => 250,
            'players' => [
                ['name' => 'Existing User', 'email' => 'existing@example.com'],
                ['name' => 'New Player', 'email' => 'new@example.com'],
            ],
        ]);

    $response->assertRedirect('/admin');

    $game = \App\Models\Game::latest()->first();
    $existingPlayer = $game->players()->where('email', 'existing@example.com')->first();
    $newPlayer = $game->players()->where('email', 'new@example.com')->first();

    expect($existingPlayer->points)->toBe(250);
    expect($newPlayer->points)->toBe(250);
});
