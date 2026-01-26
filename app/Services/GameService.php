<?php

namespace App\Services;

use App\Models\Game;
use App\Models\Player;
use Carbon\Carbon;

class GameService
{
    private const TIMEZONE = 'Europe/Brussels';

    public function __construct(
        private ?GameEndedNotificationService $notificationService = null,
    ) {
        $this->notificationService ??= app(GameEndedNotificationService::class);
    }

    public function isWordleAvailable(Game $game): bool
    {
        $now = Carbon::now(self::TIMEZONE);
        $hour = $game->wordle_hour ?? 8;
        $unlockTime = $now->copy()->setTime($hour, 0, 0);

        if ($now->lt($unlockTime)) {
            return false;
        }

        return $game->status === 'active';
    }

    public function getDayNumber(Game $game): int
    {
        if (! $game->starts_at) {
            return 0;
        }

        $hour = $game->wordle_hour ?? 8;
        $now = Carbon::now(self::TIMEZONE);
        $gameStart = $game->starts_at->copy()->setTimezone(self::TIMEZONE);

        $startDayUnlock = $gameStart->copy()->setTime($hour, 0, 0);
        if ($gameStart->gt($startDayUnlock)) {
            $startDayUnlock->addDay();
        }

        $todayUnlock = $now->copy()->setTime($hour, 0, 0);
        if ($now->lt($todayUnlock)) {
            $todayUnlock->subDay();
        }

        $daysDiff = (int) $startDayUnlock->startOfDay()->diffInDays($todayUnlock->startOfDay());

        return max(1, $daysDiff + 1);
    }

    public function getNextWordleUnlockTime(Game $game): Carbon
    {
        $hour = $game->wordle_hour ?? 8;
        $now = Carbon::now(self::TIMEZONE);
        $todayUnlock = $now->copy()->setTime($hour, 0, 0);

        if ($now->lt($todayUnlock)) {
            return $todayUnlock;
        }

        return $todayUnlock->addDay();
    }

    public function getCurrentWordleWord(Game $game): ?string
    {
        $dayNumber = $this->getDayNumber($game);
        $words = $game->wordle_words ?? [];

        if ($dayNumber < 1 || $dayNumber > count($words)) {
            return null;
        }

        return $words[$dayNumber - 1] ?? null;
    }

    public function checkWin(Game $game, Player $player, string $guess): bool
    {
        $secretWord = strtolower(preg_replace('/\s+/', '', $game->secret_word));
        $guessWord = strtolower(preg_replace('/\s+/', '', $guess));

        return $secretWord === $guessWord;
    }

    public function setWinner(Game $game, Player $player, bool $notify = true): Game
    {
        $game->winner_id = $player->id;
        $game->status = 'completed';
        $game->ends_at = Carbon::now();
        $game->save();

        if ($notify) {
            $this->notificationService->notifyAllPlayers($game);
        }

        return $game;
    }

    public function activateGame(Game $game): Game
    {
        if ($game->status !== 'pending') {
            return $game;
        }

        $now = Carbon::now(self::TIMEZONE);
        if ($game->starts_at && $now->gte($game->starts_at)) {
            $game->status = 'active';
            $game->save();
        }

        return $game;
    }

    public function getGameStatus(Game $game): array
    {
        return [
            'id' => $game->id,
            'status' => $game->status,
            'day_number' => $this->getDayNumber($game),
            'wordle_available' => $this->isWordleAvailable($game),
            'current_wordle_word' => $this->getCurrentWordleWord($game),
            'has_winner' => $game->winner_id !== null,
            'winner_id' => $game->winner_id,
        ];
    }

    public function getGamesNeedingActivation(): \Illuminate\Database\Eloquent\Collection
    {
        return Game::where('status', 'pending')
            ->where('starts_at', '<=', Carbon::now())
            ->get();
    }

    public function getActiveGames(): \Illuminate\Database\Eloquent\Collection
    {
        return Game::where('status', 'active')->get();
    }

    public function getGamesNeedingEnding(): \Illuminate\Database\Eloquent\Collection
    {
        return Game::where('status', 'active')
            ->where('ends_at', '<=', Carbon::now())
            ->get();
    }

    public function endExpiredGame(Game $game, bool $notify = true): array
    {
        if ($game->status !== 'active') {
            return ['game' => $game, 'winner' => null];
        }

        $game->load('players');

        $winner = $game->players
            ->sortByDesc('points')
            ->first();

        $hasUniqueWinner = $winner && $game->players
            ->where('points', $winner->points)
            ->count() === 1;

        $game->status = 'completed';
        $game->winner_id = $hasUniqueWinner ? $winner->id : null;
        $game->save();

        if ($notify) {
            $this->notificationService->notifyAllPlayers($game);
        }

        return [
            'game' => $game,
            'winner' => $hasUniqueWinner ? $winner : null,
        ];
    }
}
