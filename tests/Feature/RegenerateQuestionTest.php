<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\User;
use App\Services\OpenRouterService;
use App\Services\TestGameService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));
    RateLimiter::clear('question-regenerate:player:*');
    RateLimiter::clear('question-regenerate:test-player');
});

afterEach(function () {
    Carbon::setTestNow();
});

describe('GuessController regenerate', function () {
    it('regenerates an answered question successfully', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'New wit']);
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

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
            'wit' => 'Old wit',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'id' => $question->id,
                'answer' => 'no',
                'wit' => 'New wit',
            ],
        ]);
        $response->assertJsonStructure(['retry_after']);

        // Points should NOT be deducted
        expect($player->fresh()->points)->toBe(50);
    });

    it('does not deduct points on regeneration', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'yes', 'wit' => 'Wit']);
        });

        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 30,
        ]);

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het een dier?',
            'answer' => 'no',
        ]);

        $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}")->assertOk();

        expect($player->fresh()->points)->toBe(30);
    });

    it('rate limits regeneration to once per 5 minutes', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'Wit']);
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

        $question1 = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        $question2 = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het een dier?',
            'answer' => 'no',
        ]);

        // First regeneration should succeed
        $this->actingAs($user)->postJson("/play/guess/regenerate/{$question1->id}")->assertOk();

        // Second regeneration within 5 minutes should be rate limited
        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question2->id}");

        $response->assertStatus(429);
        $response->assertJson(['error' => 'regenerate_rate_limited']);
        $response->assertJsonStructure(['retry_after']);
    });

    it('allows regeneration after cooldown expires', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->twice()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'Wit']);
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

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        // First regeneration
        $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}")->assertOk();

        // Travel 6 minutes forward
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 6, 0, 'Europe/Brussels'));

        // Should be allowed again
        $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}")->assertOk();
    });

    it('rejects regeneration of failed questions', function () {
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

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'failed',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertStatus(400);
        $response->assertJson(['error' => 'not_regenerable']);
    });

    it('rejects regeneration of winner questions', function () {
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

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het woord winter?',
            'answer' => 'winner',
            'guessed_word' => 'winter',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertStatus(400);
        $response->assertJson(['error' => 'not_regenerable']);
    });

    it('rejects regeneration of another players question', function () {
        $user1 = User::factory()->create(['email' => 'player1@example.com']);
        $user2 = User::factory()->create(['email' => 'player2@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'secret_word' => 'winter',
        ]);

        $player1 = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player1@example.com',
            'points' => 50,
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player2@example.com',
            'points' => 50,
        ]);

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player1->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        $response = $this->actingAs($user2)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertForbidden();
        $response->assertJson(['error' => 'unauthorized']);
    });

    it('rejects regeneration when game is not active', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'completed',
            'secret_word' => 'winter',
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        // activePlayer() returns null for completed games, so we get 403 (no_active_game)
        $response->assertForbidden();
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('handles AI error during regeneration', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => false, 'error' => 'API error']);
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

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
            'wit' => 'Original wit',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertStatus(500);
        $response->assertJson(['error' => 'ai_error']);

        // Original answer should be preserved
        $question->refresh();
        expect($question->answer)->toBe('yes');
        expect($question->wit)->toBe('Original wit');
    });

    it('does not consume rate limit on AI error', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->twice()
                ->andReturnValues([
                    ['success' => false, 'error' => 'API error'],
                    ['success' => true, 'answer' => 'no', 'wit' => 'New wit'],
                ]);
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

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        // First attempt fails (AI error)
        $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}")->assertStatus(500);

        // Second attempt should still be allowed (rate limit not consumed on failure)
        $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}")->assertOk();
    });
});

describe('Test mode regeneration', function () {
    it('regenerates a test mode question with 10 second cooldown', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'New test wit']);
        });

        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame([
            'questions' => [
                ['question' => 'Is het koud?', 'answer' => 'yes', 'wit' => 'Old wit'],
            ],
        ]);

        $response = $this->actingAs($admin)->postJson('/play/guess/regenerate/1');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'id' => 1,
                'answer' => 'no',
                'wit' => 'New test wit',
            ],
            'retry_after' => 10,
        ]);
    });

    it('rate limits test mode regeneration to 10 seconds', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'Wit']);
        });

        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame([
            'questions' => [
                ['question' => 'Is het koud?', 'answer' => 'yes'],
                ['question' => 'Is het een dier?', 'answer' => 'no'],
            ],
        ]);

        // First regeneration should succeed
        $this->actingAs($admin)->postJson('/play/guess/regenerate/1')->assertOk();

        // Second regeneration within 10 seconds should be rate limited
        $response = $this->actingAs($admin)->postJson('/play/guess/regenerate/2');

        $response->assertStatus(429);
        $response->assertJson(['error' => 'regenerate_rate_limited']);
    });

    it('allows test mode regeneration after 10 second cooldown', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->twice()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'Wit']);
        });

        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame([
            'questions' => [
                ['question' => 'Is het koud?', 'answer' => 'yes'],
            ],
        ]);

        // First regeneration
        $this->actingAs($admin)->postJson('/play/guess/regenerate/1')->assertOk();

        // Travel 11 seconds forward
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 11, 'Europe/Brussels'));

        // Should be allowed again
        $this->actingAs($admin)->postJson('/play/guess/regenerate/1')->assertOk();
    });

    it('rejects test mode regeneration for non-regenerable answers', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame([
            'questions' => [
                ['question' => 'Is het woord winter?', 'answer' => 'winner'],
            ],
        ]);

        $response = $this->actingAs($admin)->postJson('/play/guess/regenerate/1');

        $response->assertStatus(400);
        $response->assertJson(['error' => 'not_regenerable']);
    });

    it('returns 404 for non-existent test mode question index', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $response = $this->actingAs($admin)->postJson('/play/guess/regenerate/99');

        $response->assertNotFound();
    });

    it('updates session with regenerated answer', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'Updated wit']);
        });

        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame([
            'questions' => [
                ['question' => 'Is het koud?', 'answer' => 'yes', 'wit' => 'Old wit'],
            ],
        ]);

        $this->actingAs($admin)->postJson('/play/guess/regenerate/1')->assertOk();

        $testGame = $testGameService->getTestGame();
        expect($testGame['questions'][0]['answer'])->toBe('no');
        expect($testGame['questions'][0]['wit'])->toBe('Updated wit');
    });
});
