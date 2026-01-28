<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\User;
use App\Services\OpenRouterService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));
});

afterEach(function () {
    Carbon::setTestNow();
});

describe('GuessController show', function () {
    it('shows guess page for authenticated user with active game', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/guess');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/guess')
            ->has('player')
            ->has('game')
            ->has('questions')
            ->where('player.points', 50)
            ->where('game.status', 'active')
            ->where('game.secret_word_length', 6) // 'winter' has 6 letters
        );
    });

    it('provides secret word length hint for varying word lengths', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'skivakantie', // 11 letters
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
        ]);

        $response = $this->actingAs($user)->get('/play/guess');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('game.secret_word_length', 11)
        );
    });

    it('shows player questions', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
        ]);

        Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        $response = $this->actingAs($user)->get('/play/guess');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('questions', 1)
            ->where('questions.0.question', 'Is het koud?')
            ->where('questions.0.answer', 'yes')
        );
    });

    it('returns error when no active game', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/play/guess');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/guess')
            ->has('error')
        );
    });
});

describe('GuessController ask', function () {
    it('allows asking a question with sufficient points', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->with('winter', 'Is het koud?', \Mockery::any(), \Mockery::any())
                ->andReturn(['success' => true, 'answer' => 'yes']);
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'question' => ['id', 'question', 'answer', 'player', 'created_at'],
            'points_remaining',
        ]);

        expect($player->fresh()->points)->toBe(40); // Deducted 10 points (guess_cost)
    });

    it('rejects question with insufficient points (9 pts < 10 guess_cost)', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 9,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'insufficient_points']);
    });

    it('allows exactly one question with 10 points', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'yes']);
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 10,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertOk();
        expect($player->fresh()->points)->toBe(0); // 10 - 10 = 0
    });

    it('rejects question when game is pending', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'pending',
            'secret_word' => 'winter',
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('rejects question when game is completed', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'completed',
            'secret_word' => 'winter',
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('rejects empty question', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => '',
        ]);

        $response->assertStatus(422);
    });

    it('handles direct word guess correctly', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn([
                    'success' => true,
                    'type' => 'direct_guess',
                    'guessed_word' => 'winter',
                ]);
            $mock->shouldReceive('generateBomaWit')->andReturn('Test wit');
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het woord winter?',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'winner' => true,
        ]);

        $game->refresh();
        expect($game->status)->toBe('completed');
        expect($game->winner_id)->toBe($player->id);
    });

    it('handles wrong word guess correctly', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn([
                    'success' => true,
                    'type' => 'direct_guess',
                    'guessed_word' => 'zomer',
                ]);
            $mock->shouldReceive('generateBomaWit')->andReturn('Test wit');
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het woord zomer?',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'winner' => false,
            'wrong_guess' => true,
            'guessed_word' => 'zomer',
        ]);

        expect($player->fresh()->points)->toBe(40);
    });

    it('rejects multi-guess attempts', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn([
                    'success' => true,
                    'type' => 'multi_guess',
                ]);
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het winter of zomer of lente?',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => 'multi_guess']);
    });

    it('handles AI error gracefully', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn([
                    'success' => false,
                    'error' => 'API error',
                ]);
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertStatus(500);
        $response->assertJson(['error' => 'ai_error']);
    });
});
