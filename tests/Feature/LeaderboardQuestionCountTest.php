<?php

use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));
});

afterEach(function () {
    Carbon::setTestNow();
});

describe('Leaderboard question count display', function () {
    it('includes questions_count for current player when ranked outside top 3', function () {
        $user = User::factory()->create(['email' => 'current@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        // Create 3 players with higher points to push current user to 4th place
        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'first@example.com',
            'name' => 'First Place',
            'points' => 100,
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'second@example.com',
            'name' => 'Second Place',
            'points' => 90,
        ]);

        Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'third@example.com',
            'name' => 'Third Place',
            'points' => 80,
        ]);

        // Current user in 4th place
        $currentPlayer = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'current@example.com',
            'name' => 'Current Player',
            'points' => 30,
        ]);

        // Create some questions for the current player
        Question::create([
            'game_id' => $game->id,
            'player_id' => $currentPlayer->id,
            'question_text' => 'Is het koud?',
            'answer' => 'yes',
        ]);

        Question::create([
            'game_id' => $game->id,
            'player_id' => $currentPlayer->id,
            'question_text' => 'Is het een seizoen?',
            'answer' => 'yes',
        ]);

        Question::create([
            'game_id' => $game->id,
            'player_id' => $currentPlayer->id,
            'question_text' => 'Is het winter?',
            'answer' => 'yes',
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('players', 4)
            // Current player should be in 4th place
            ->where('players.3.name', 'Current Player')
            ->where('players.3.rank', 4)
            ->where('players.3.is_current', true)
            // And should have their question count
            ->where('players.3.questions_count', 3)
        );
    });

    it('includes questions_count for all players regardless of rank', function () {
        $user = User::factory()->create(['email' => 'player1@example.com']);

        $game = Game::factory()->create(['status' => 'active', 'secret_word' => 'winter']);

        $player1 = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player1@example.com',
            'name' => 'Player 1',
            'points' => 50,
        ]);

        $player2 = Player::factory()->create([
            'game_id' => $game->id,
            'email' => 'player2@example.com',
            'name' => 'Player 2',
            'points' => 30,
        ]);

        // Create questions for player 2 who is in 2nd place
        Question::create([
            'game_id' => $game->id,
            'player_id' => $player2->id,
            'question_text' => 'Is het een dier?',
            'answer' => 'no',
        ]);

        $response = $this->actingAs($user)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('players', 2)
            // Player 1 (current, rank 1) has 0 questions
            ->where('players.0.questions_count', 0)
            // Player 2 (rank 2) has 1 question
            ->where('players.1.questions_count', 1)
        );
    });
});
