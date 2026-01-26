<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\User;
use App\Models\WordleAttempt;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));
});

afterEach(function () {
    Carbon::setTestNow();
});

describe('PlayersController show', function () {
    it('shows players page for authenticated user with active game', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'name' => 'Test Player',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/players')
            ->has('player')
            ->has('game')
            ->has('players')
            ->where('player.points', 50)
            ->where('game.status', 'active')
        );
    });

    it('returns error when no active game', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/players')
            ->has('error')
        );
    });

    it('lists all players in the game sorted by points', function () {
        $user = User::factory()->create(['email' => 'player1@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        $player1 = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player1@example.com',
            'name' => 'Player 1',
            'points' => 30,
        ]);

        $player2 = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player2@example.com',
            'name' => 'Player 2',
            'points' => 50,
        ]);

        $player3 = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player3@example.com',
            'name' => 'Player 3',
            'points' => 20,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('players', 3)
            ->where('players.0.name', 'Player 2')
            ->where('players.0.rank', 1)
            ->where('players.0.points', 50)
            ->where('players.1.name', 'Player 1')
            ->where('players.1.rank', 2)
            ->where('players.2.name', 'Player 3')
            ->where('players.2.rank', 3)
        );
    });

    it('marks current player correctly', function () {
        $user = User::factory()->create(['email' => 'current@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'current@example.com',
            'name' => 'Current Player',
            'points' => 40,
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'other@example.com',
            'name' => 'Other Player',
            'points' => 60,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.0.is_current', false) // Other Player ranked 1st
            ->where('players.1.is_current', true)   // Current Player ranked 2nd
        );
    });

    it('includes question count for each player', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        Question::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'question_text' => 'Is het een seizoen?',
            'answer' => 'yes',
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.0.questions_count', 2)
        );
    });

    it('includes wordle completion stats for each player', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::now()->subDays(2),
            'wordle_words' => ['woord', 'appel', 'tafel'],
        ]);

        $player = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'points' => 50,
        ]);

        WordleAttempt::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'day_number' => 1,
            'guesses' => [['word' => 'woord', 'result' => []]],
            'completed' => true,
            'points_earned' => 6,
        ]);

        WordleAttempt::create([
            'game_id' => $game->id,
            'player_id' => $player->id,
            'day_number' => 2,
            'guesses' => [['word' => 'xxxxx', 'result' => []], ['word' => 'appel', 'result' => []]],
            'completed' => true,
            'points_earned' => 5,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.0.wordles_completed', 2)
            ->where('players.0.avg_wordle_guesses', 1.5) // (1 + 2) / 2
        );
    });

    it('includes avatar url for players', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'test@example.com',
            'name' => 'Test Player',
            'avatar_url' => 'player09',
            'points' => 50,
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('players.0.avatar_url', 'player09')
        );
    });
});
