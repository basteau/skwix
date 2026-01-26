<?php

use App\Models\Game;
use App\Models\User;
use App\Services\WordlistService;

beforeEach(function () {
    $this->admin = User::factory()->create(['is_admin' => true]);
    $wordlistService = app(WordlistService::class);
    $this->wordlist = $wordlistService->getRandomWords(6);
    $this->newWordlist = $wordlistService->getRandomWords(6);
});

it('allows wordle word updates for draft games', function () {
    $game = Game::factory()->create([
        'status' => 'draft',
        'wordle_words' => $this->wordlist,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/wordle-words", [
            'wordle_words' => $this->newWordlist,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    $game->refresh();
    expect($game->wordle_words)->toBe(array_map('strtolower', $this->newWordlist));
});

it('rejects wordle word updates for pending games', function () {
    $game = Game::factory()->create([
        'status' => 'pending',
        'wordle_words' => $this->wordlist,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/wordle-words", [
            'wordle_words' => $this->newWordlist,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error');

    $game->refresh();
    expect($game->wordle_words)->toBe($this->wordlist);
});

it('rejects wordle word updates for active games', function () {
    $game = Game::factory()->create([
        'status' => 'active',
        'wordle_words' => $this->wordlist,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/wordle-words", [
            'wordle_words' => $this->newWordlist,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error');

    $game->refresh();
    expect($game->wordle_words)->toBe($this->wordlist);
});

it('rejects wordle word updates for completed games', function () {
    $game = Game::factory()->create([
        'status' => 'completed',
        'wordle_words' => $this->wordlist,
    ]);

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/wordle-words", [
            'wordle_words' => $this->newWordlist,
        ]);

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error');

    $game->refresh();
    expect($game->wordle_words)->toBe($this->wordlist);
});

it('validates a valid word', function () {
    $validWord = app(WordlistService::class)->getRandomWords(1)[0];

    $response = $this->actingAs($this->admin)
        ->get("/admin/validate-word?word={$validWord}");

    $response->assertOk();
    $response->assertJson([
        'valid' => true,
        'message' => 'Geldig woord',
    ]);
});

it('validates an invalid word and returns suggestions', function () {
    $response = $this->actingAs($this->admin)
        ->get('/admin/validate-word?word=xxxxx');

    $response->assertOk();
    $response->assertJson([
        'valid' => false,
        'message' => 'Onbekend woord',
    ]);
    expect($response->json('suggestions'))->toBeArray();
});

it('rejects words that are not 5 letters', function () {
    $response = $this->actingAs($this->admin)
        ->get('/admin/validate-word?word=abc');

    $response->assertOk();
    $response->assertJson([
        'valid' => false,
        'message' => 'Woord moet 5 letters zijn',
    ]);
});

it('rejects invalid wordle words when updating draft game', function () {
    $game = Game::factory()->create([
        'status' => 'draft',
        'wordle_words' => $this->wordlist,
    ]);

    $invalidWords = ['xxxxx', 'yyyyy', 'zzzzz', 'qqqqq', 'wwwww', 'jjjjj'];

    $response = $this->actingAs($this->admin)
        ->put("/admin/game/{$game->id}/wordle-words", [
            'wordle_words' => $invalidWords,
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('wordle_words');

    $game->refresh();
    expect($game->wordle_words)->toBe($this->wordlist);
});
