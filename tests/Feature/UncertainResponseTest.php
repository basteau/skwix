<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\Sabotage;
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

describe('Uncertain response - ask flow', function () {
    it('stores uncertain answer from AI correctly', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property_question']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn([
                    'success' => true,
                    'answer' => 'uncertain',
                    'wit' => 'Tja, daar kan Boma niet met zekerheid op antwoorden!',
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

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het gevaarlijk?',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'answer' => 'uncertain',
                'wit' => 'Tja, daar kan Boma niet met zekerheid op antwoorden!',
            ],
        ]);

        // Points should be deducted
        expect($player->fresh()->points)->toBe(40);

        // Question should be stored in DB
        $question = Question::where('player_id', $player->id)->first();
        expect($question->answer)->toBe('uncertain');
        expect($question->wit)->toBe('Tja, daar kan Boma niet met zekerheid op antwoorden!');
    });

    it('does not apply sabotage to uncertain answers', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property_question']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn([
                    'success' => true,
                    'answer' => 'uncertain',
                    'wit' => 'Niet zeker, makker!',
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

        // Create a pending sabotage for this player
        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'saboteur@example.com',
            'points' => 50,
        ]);

        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het gevaarlijk?',
        ]);

        $response->assertOk();

        // Answer should remain uncertain (not flipped)
        $question = Question::where('player_id', $player->id)->first();
        expect($question->answer)->toBe('uncertain');

        // Sabotage should still be pending (not consumed)
        expect(Sabotage::where('target_id', $player->id)->where('status', 'pending')->count())->toBe(1);
    });
});

describe('Uncertain response - regeneration flow', function () {
    it('allows regeneration of uncertain answers', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'yes', 'wit' => 'Ja natuurlijk!']);
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
            'question_text' => 'Is het gevaarlijk?',
            'answer' => 'uncertain',
            'wit' => 'Niet zeker, makker!',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'id' => $question->id,
                'answer' => 'yes',
                'wit' => 'Ja natuurlijk!',
            ],
        ]);

        // Points should NOT be deducted
        expect($player->fresh()->points)->toBe(50);
    });

    it('can regenerate from yes/no to uncertain', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn([
                    'success' => true,
                    'answer' => 'uncertain',
                    'wit' => 'Dat is twijfelachtig, vriend!',
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
            'question_text' => 'Is het gevaarlijk?',
            'answer' => 'yes',
            'wit' => 'Ja!',
        ]);

        $response = $this->actingAs($user)->postJson("/play/guess/regenerate/{$question->id}");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'answer' => 'uncertain',
                'wit' => 'Dat is twijfelachtig, vriend!',
            ],
        ]);
    });
});

describe('Uncertain response - test mode', function () {
    it('regenerates uncertain answer in test mode', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no', 'wit' => 'Nee hoor!']);
        });

        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame([
            'questions' => [
                ['question' => 'Is het gevaarlijk?', 'answer' => 'uncertain', 'wit' => 'Niet zeker!'],
            ],
        ]);

        $response = $this->actingAs($admin)->postJson('/play/guess/regenerate/1');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'id' => 1,
                'answer' => 'no',
                'wit' => 'Nee hoor!',
            ],
        ]);
    });
});

describe('OpenRouterService uncertain parsing', function () {
    it('parses uncertain JSON answer correctly', function () {
        $service = app(OpenRouterService::class);

        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('parseAnswer');
        $method->setAccessible(true);

        expect($method->invoke($service, '{"answer":"uncertain"}'))->toBe('uncertain');
    });

    it('parses uncertain answer from legacy text', function () {
        $service = app(OpenRouterService::class);

        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('parseAnswer');
        $method->setAccessible(true);

        expect($method->invoke($service, 'niet zeker'))->toBe('uncertain');
        expect($method->invoke($service, 'onduidelijk'))->toBe('uncertain');
        expect($method->invoke($service, 'hangt af'))->toBe('uncertain');
        expect($method->invoke($service, 'It depends on context'))->toBe('uncertain');
    });

    it('returns uncertain fallback wit', function () {
        $service = app(OpenRouterService::class);

        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('getFallbackWit');
        $method->setAccessible(true);

        expect($method->invoke($service, 'uncertain'))->toBe('Daar kan ik niet met zekerheid op antwoorden');
    });
});
