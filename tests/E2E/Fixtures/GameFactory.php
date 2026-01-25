<?php

namespace Tests\E2E\Fixtures;

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Carbon\Carbon;

/**
 * Factory for creating deterministic game fixtures for E2E tests.
 */
class GameFactory
{
    /**
     * Create a pending game with invite code.
     */
    public static function pending(array $attributes = []): Game
    {
        return Game::create(array_merge([
            'name' => 'E2E Test Game',
            'invite_code' => 'TEST123',
            'secret_word' => 'WINTER',
            'wordle_words' => ['SNEEUW', 'VORST', 'IJZEL'],
            'status' => 'pending',
            'starts_at' => Carbon::now()->addDay(),
            'question_cost' => 10,
            'correct_wordle_points' => 5,
        ], $attributes));
    }

    /**
     * Create an active game ready for play.
     */
    public static function active(array $attributes = []): Game
    {
        return Game::create(array_merge([
            'name' => 'E2E Test Game',
            'invite_code' => 'TEST123',
            'secret_word' => 'WINTER',
            'wordle_words' => ['SNEEUW', 'VORST', 'IJZEL'],
            'status' => 'active',
            'starts_at' => Carbon::now()->subDay(),
            'question_cost' => 10,
            'correct_wordle_points' => 5,
        ], $attributes));
    }

    /**
     * Create a completed game with winner.
     */
    public static function completed(array $attributes = []): Game
    {
        $game = self::active($attributes);
        $winner = self::player($game);

        $game->update([
            'status' => 'completed',
            'winner_id' => $winner->id,
            'ends_at' => Carbon::now(),
        ]);

        return $game->fresh();
    }

    /**
     * Create a player for a game.
     */
    public static function player(Game $game, array $attributes = []): Player
    {
        $user = User::create([
            'name' => $attributes['name'] ?? 'E2E Player',
            'email' => $attributes['email'] ?? 'e2e-'.uniqid().'@test.com',
            'password' => bcrypt('password'),
        ]);

        return Player::create(array_merge([
            'game_id' => $game->id,
            'user_id' => $user->id,
            'name' => $user->name,
            'points' => 10,
        ], $attributes));
    }

    /**
     * Create multiple players for a game.
     */
    public static function players(Game $game, int $count = 4): array
    {
        $players = [];

        for ($i = 1; $i <= $count; $i++) {
            $players[] = self::player($game, [
                'name' => "Player {$i}",
                'email' => "player{$i}@test.com",
                'points' => 10 + ($i * 5),
            ]);
        }

        return $players;
    }

    /**
     * Set wordle words for a game.
     */
    public static function setWordleWords(Game $game, array $words): Game
    {
        $game->update(['wordle_words' => $words]);

        return $game->fresh();
    }

    /**
     * Set secret word for a game.
     */
    public static function setSecretWord(Game $game, string $word): Game
    {
        $game->update(['secret_word' => strtoupper($word)]);

        return $game->fresh();
    }

    /**
     * Create a game with all fixtures ready for testing.
     */
    public static function createGame(array $attributes = [], int $playerCount = 4): array
    {
        $game = self::active($attributes);
        $players = self::players($game, $playerCount);

        return [
            'game' => $game,
            'players' => $players,
        ];
    }

    /**
     * Create a simple login-ready user with player.
     */
    public static function loginablePlayer(Game $game, array $attributes = []): array
    {
        $password = 'password';
        $email = $attributes['email'] ?? 'test-'.uniqid().'@test.com';

        $user = User::create([
            'name' => $attributes['name'] ?? 'Test Player',
            'email' => $email,
            'password' => bcrypt($password),
        ]);

        $player = Player::create(array_merge([
            'game_id' => $game->id,
            'user_id' => $user->id,
            'name' => $user->name,
            'points' => 10,
        ], $attributes));

        return [
            'user' => $user,
            'player' => $player,
            'email' => $email,
            'password' => $password,
        ];
    }
}
