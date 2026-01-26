<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\Sabotage;
use App\Models\User;
use App\Services\OpenRouterService;
use App\Services\SabotageService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));
});

afterEach(function () {
    Carbon::setTestNow();
});

describe('SabotageService placeSabotage', function () {
    it('places a sabotage successfully', function () {
        $game = Game::factory()->create(['status' => 'active']);

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 50,
        ]);

        $target = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 30,
        ]);

        $service = app(SabotageService::class);
        $result = $service->placeSabotage($saboteur, $target);

        expect($result['success'])->toBeTrue();
        expect($result['sabotage'])->toBeInstanceOf(Sabotage::class);
        expect($saboteur->fresh()->points)->toBe(42); // 50 - 8 (sabotage_cost)
        expect(Sabotage::where('saboteur_id', $saboteur->id)->count())->toBe(1);
    });

    it('prevents self-sabotage', function () {
        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 50,
        ]);

        $service = app(SabotageService::class);
        $result = $service->placeSabotage($player, $player);

        expect($result['success'])->toBeFalse();
        expect($result['error'])->toBe('cannot_sabotage_self');
        expect($player->fresh()->points)->toBe(50); // Points unchanged
    });

    it('prevents sabotage with insufficient points', function () {
        $game = Game::factory()->create(['status' => 'active']);

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 5, // Less than 8 (sabotage_cost)
        ]);

        $target = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        $service = app(SabotageService::class);
        $result = $service->placeSabotage($saboteur, $target);

        expect($result['success'])->toBeFalse();
        expect($result['error'])->toBe('insufficient_points');
    });

    it('prevents duplicate pending sabotage on same target', function () {
        $game = Game::factory()->create(['status' => 'active']);

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 50,
        ]);

        $target = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        $service = app(SabotageService::class);

        // First sabotage should succeed
        $result1 = $service->placeSabotage($saboteur, $target);
        expect($result1['success'])->toBeTrue();

        // Second sabotage on same target should fail
        $result2 = $service->placeSabotage($saboteur, $target);
        expect($result2['success'])->toBeFalse();
        expect($result2['error'])->toBe('already_pending');
    });

    it('prevents sabotage between different games', function () {
        $game1 = Game::factory()->create(['status' => 'active']);
        $game2 = Game::factory()->create(['status' => 'active']);

        $saboteur = Player::factory()->create([
            'game_id' => $game1->id,
            'points' => 50,
        ]);

        $target = Player::factory()->create([
            'game_id' => $game2->id,
        ]);

        $service = app(SabotageService::class);
        $result = $service->placeSabotage($saboteur, $target);

        expect($result['success'])->toBeFalse();
        expect($result['error'])->toBe('different_games');
    });
});

describe('SabotageService consumePendingSabotage', function () {
    it('consumes the oldest pending sabotage', function () {
        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $saboteur = Player::factory()->create(['game_id' => $game->id, 'points' => 50]);
        $target = Player::factory()->create(['game_id' => $game->id]);

        // Create sabotage
        $sabotage = Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $target->id,
            'status' => 'pending',
        ]);

        // Create a question
        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $target->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        $service = app(SabotageService::class);
        $consumedSabotage = $service->consumePendingSabotage($target, $question);

        expect($consumedSabotage)->not->toBeNull();
        expect($consumedSabotage->id)->toBe($sabotage->id);
        expect($consumedSabotage->fresh()->status)->toBe('applied');
        expect($consumedSabotage->fresh()->question_id)->toBe($question->id);
    });

    it('returns null when no pending sabotage exists', function () {
        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player = Player::factory()->create(['game_id' => $game->id]);

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        $service = app(SabotageService::class);
        $result = $service->consumePendingSabotage($player, $question);

        expect($result)->toBeNull();
    });

    it('consumes sabotages in FIFO order', function () {
        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $saboteur1 = Player::factory()->create(['game_id' => $game->id, 'points' => 50]);
        $saboteur2 = Player::factory()->create(['game_id' => $game->id, 'points' => 50]);
        $target = Player::factory()->create(['game_id' => $game->id]);

        // Create two sabotages with different timestamps
        $sabotage1 = Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur1->id,
            'target_id' => $target->id,
            'status' => 'pending',
            'created_at' => now()->subMinutes(5),
        ]);

        $sabotage2 = Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur2->id,
            'target_id' => $target->id,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $question1 = Question::create([
            'game_id' => $game->id,
            'player_id' => $target->id,
            'question_text' => 'Question 1?',
            'answer' => 'yes',
        ]);

        $service = app(SabotageService::class);

        // First consume should get the oldest sabotage
        $consumed1 = $service->consumePendingSabotage($target, $question1);
        expect($consumed1->id)->toBe($sabotage1->id);

        // Create second question
        $question2 = Question::create([
            'game_id' => $game->id,
            'player_id' => $target->id,
            'question_text' => 'Question 2?',
            'answer' => 'no',
        ]);

        // Second consume should get the next sabotage
        $consumed2 = $service->consumePendingSabotage($target, $question2);
        expect($consumed2->id)->toBe($sabotage2->id);

        // Third consume should return null
        $question3 = Question::create([
            'game_id' => $game->id,
            'player_id' => $target->id,
            'question_text' => 'Question 3?',
            'answer' => 'yes',
        ]);

        $consumed3 = $service->consumePendingSabotage($target, $question3);
        expect($consumed3)->toBeNull();
    });
});

describe('SabotageService flipAnswer', function () {
    it('flips yes to no', function () {
        $service = app(SabotageService::class);
        expect($service->flipAnswer('yes'))->toBe('no');
    });

    it('flips no to yes', function () {
        $service = app(SabotageService::class);
        expect($service->flipAnswer('no'))->toBe('yes');
    });

    it('does not flip unclear', function () {
        $service = app(SabotageService::class);
        expect($service->flipAnswer('unclear'))->toBe('unclear');
    });

    it('does not flip unknown', function () {
        $service = app(SabotageService::class);
        expect($service->flipAnswer('unknown'))->toBe('unknown');
    });

    it('does not flip winner', function () {
        $service = app(SabotageService::class);
        expect($service->flipAnswer('winner'))->toBe('winner');
    });
});

describe('SabotageService revealSabotages', function () {
    it('reveals sabotaged question IDs', function () {
        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player = Player::factory()->create(['game_id' => $game->id, 'points' => 50]);
        $saboteur = Player::factory()->create(['game_id' => $game->id]);

        $question1 = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Q1?',
            'answer' => 'yes',
        ]);

        $question2 = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Q2?',
            'answer' => 'no',
        ]);

        // Create applied sabotage
        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'question_id' => $question1->id,
            'status' => 'applied',
        ]);

        $service = app(SabotageService::class);
        $result = $service->revealSabotages($player);

        expect($result['success'])->toBeTrue();
        expect($result['sabotaged_question_ids'])->toBe([$question1->id]);
        expect($player->fresh()->points)->toBe(40); // 50 - 10 (reveal_cost)
    });

    it('fails with insufficient points', function () {
        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 5, // Less than 10 (reveal_cost)
        ]);

        $service = app(SabotageService::class);
        $result = $service->revealSabotages($player);

        expect($result['success'])->toBeFalse();
        expect($result['error'])->toBe('insufficient_points');
        expect($player->fresh()->points)->toBe(5); // Unchanged
    });
});

describe('SabotageController place', function () {
    it('places sabotage via API', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $target = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage', [
            'target_id' => $target->id,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'points_remaining' => 42, // 50 - 8 (sabotage_cost)
        ]);

        expect(Sabotage::where('saboteur_id', $player->id)->exists())->toBeTrue();
    });

    it('rejects sabotage with insufficient points', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 5,
        ]);

        $target = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage', [
            'target_id' => $target->id,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'insufficient_points']);
    });

    it('rejects self-sabotage', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage', [
            'target_id' => $player->id,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => 'cannot_sabotage_self']);
    });

    it('rejects sabotage when game is not active', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        // Note: activePlayer() only finds players with active games,
        // so a pending game means no active player is found
        $game = Game::factory()->create(['status' => 'pending']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $target = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage', [
            'target_id' => $target->id,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'no_active_game']);
    });

    it('rejects sabotage when target not found', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage', [
            'target_id' => 9999,
        ]);

        $response->assertNotFound();
        $response->assertJson(['error' => 'target_not_found']);
    });
});

describe('SabotageController reveal', function () {
    it('reveals sabotages via API', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $saboteur = Player::factory()->create(['game_id' => $game->id]);

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Test?',
            'answer' => 'yes',
        ]);

        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'question_id' => $question->id,
            'status' => 'applied',
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage/reveal');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'points_remaining' => 40, // 50 - 10 (reveal_cost)
        ]);
        $response->assertJsonStructure(['sabotaged_question_ids']);
    });

    it('rejects reveal with insufficient points', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 5,
        ]);

        $response = $this->actingAs($user)->postJson('/play/sabotage/reveal');

        $response->assertStatus(400);
        $response->assertJson(['error' => 'insufficient_points']);
    });
});

describe('GuessController with sabotage', function () {
    it('flips yes answer to no when sabotaged', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'yes']);

            // Called for the flipped answer
            $mock->shouldReceive('generateBomaWit')
                ->once()
                ->andReturn('Gesaboteerd!');
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

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 30,
        ]);

        // Place a sabotage
        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertOk();
        // The answer should be flipped from 'yes' to 'no'
        $response->assertJson([
            'success' => true,
            'question' => [
                'answer' => 'no', // Flipped!
            ],
        ]);

        // Verify sabotage was applied
        $sabotage = Sabotage::where('saboteur_id', $saboteur->id)->first();
        expect($sabotage->status)->toBe('applied');
        expect($sabotage->question_id)->not->toBeNull();
    });

    it('flips no answer to yes when sabotaged', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'no']);

            // Called for the flipped answer
            $mock->shouldReceive('generateBomaWit')
                ->once()
                ->andReturn('Gesaboteerd!');
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

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Leeft het in water?',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'answer' => 'yes', // Flipped from 'no'
            ],
        ]);
    });

    it('does not consume sabotage for unclear answers', function () {
        $this->mock(OpenRouterService::class, function ($mock) {
            $mock->shouldReceive('classifyQuestion')
                ->once()
                ->andReturn(['success' => true, 'type' => 'property']);

            $mock->shouldReceive('askQuestion')
                ->once()
                ->andReturn(['success' => true, 'answer' => 'unclear']);
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

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Iets vaags?',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'answer' => 'unclear', // Not flipped
            ],
        ]);

        // Sabotage should NOT be consumed for unclear answers (only for yes/no)
        $sabotage = Sabotage::where('saboteur_id', $saboteur->id)->first();
        expect($sabotage->status)->toBe('pending');
    });

    it('does not apply sabotage when none pending', function () {
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

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->postJson('/play/guess/ask', [
            'question' => 'Is het koud?',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'question' => [
                'answer' => 'yes', // Original answer, not flipped
            ],
        ]);
    });
});

describe('PlayersController with sabotage data', function () {
    it('includes sabotage cost in response', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('sabotage')
            ->where('sabotage.cost', 8)
            ->where('sabotage.reveal_cost', 10)
        );
    });

    it('shows can_sabotage false for current player', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.0.can_sabotage', false)
            ->where('players.0.is_current', true)
        );
    });

    it('shows can_sabotage true for other players without pending sabotage', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 20,
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'other@example.com',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.0.can_sabotage', true) // Other player ranked first
            ->where('players.0.is_current', false)
        );
    });

    it('shows can_sabotage false when pending sabotage exists', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $currentPlayer = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $otherPlayer = Player::factory()->create([
            'game_id' => $game->id,
            'points' => 30,
        ]);

        // Create pending sabotage
        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $currentPlayer->id,
            'target_id' => $otherPlayer->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.1.can_sabotage', false) // Has pending sabotage
            ->where('players.1.has_pending_sabotage', true)
        );
    });

    it('shows can_reveal when player has been sabotaged', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        $saboteur = Player::factory()->create([
            'game_id' => $game->id,
        ]);

        $question = Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Test?',
            'answer' => 'yes',
        ]);

        Sabotage::create([
            'game_id' => $game->id,
            'saboteur_id' => $saboteur->id,
            'target_id' => $player->id,
            'question_id' => $question->id,
            'status' => 'applied',
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('sabotage.cost')
            ->has('sabotage.reveal_cost')
        );
    });
});
