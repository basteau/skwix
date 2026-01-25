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
            'wordle_words' => $this->wordlist,
            'players' => [
                ['name' => 'John', 'email' => 'john@example.com', 'avatar' => null],
                ['name' => 'Jane', 'email' => 'jane@example.com', 'avatar' => null],
            ],
        ]);

    $response->assertRedirect('/admin');
    $response->assertSessionHas('success');
});
