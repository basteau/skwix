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
        if ($game->status !== 'active') {
            return false;
        }

        $now = Carbon::now(self::TIMEZONE);
        $firstUnlock = $this->getFirstWordleUnlockTime($game);

        if ($now->lt($firstUnlock)) {
            return false;
        }

        $lastUnlock = $this->getLastWordleUnlockTime($game);

        return $now->gte($lastUnlock);
    }

    public function getLastWordleUnlockTime(Game $game): Carbon
    {
        $intervalHours = $game->wordle_interval_hours ?? 24;
        $hour = $game->wordle_hour ?? 8;
        $now = Carbon::now(self::TIMEZONE);
        $firstUnlock = $this->getFirstWordleUnlockTime($game);

        if ($now->lt($firstUnlock)) {
            return $firstUnlock;
        }

        $hoursSinceFirstUnlock = $firstUnlock->diffInHours($now);
        $intervalsPassed = (int) floor($hoursSinceFirstUnlock / $intervalHours);

        return $firstUnlock->copy()->addHours($intervalsPassed * $intervalHours);
    }

    public function getFirstWordleUnlockTime(Game $game): Carbon
    {
        $hour = $game->wordle_hour ?? 8;

        if (! $game->starts_at) {
            return Carbon::now(self::TIMEZONE)->setTime($hour, 0, 0);
        }

        $gameStart = Carbon::parse($game->starts_at)->setTimezone(self::TIMEZONE);
        $unlockOnStartDay = $gameStart->copy()->setTime($hour, 0, 0);

        if ($gameStart->lte($unlockOnStartDay)) {
            return $unlockOnStartDay;
        }

        if ($gameStart->hour === $hour) {
            return $gameStart;
        }

        return $unlockOnStartDay->copy()->addDay();
    }

    public function getDayNumber(Game $game): int
    {
        return $this->getWordleNumber($game);
    }

    public function getWordleNumber(Game $game): int
    {
        if (! $game->starts_at) {
            return 0;
        }

        $intervalHours = $game->wordle_interval_hours ?? 24;
        $now = Carbon::now(self::TIMEZONE);
        $firstUnlock = $this->getFirstWordleUnlockTime($game);

        if ($now->lt($firstUnlock)) {
            return 1;
        }

        $hoursSinceFirstUnlock = $firstUnlock->diffInHours($now);
        $intervalsPassed = (int) floor($hoursSinceFirstUnlock / $intervalHours);

        return $intervalsPassed + 1;
    }

    public function getNextWordleUnlockTime(Game $game): Carbon
    {
        $intervalHours = $game->wordle_interval_hours ?? 24;
        $now = Carbon::now(self::TIMEZONE);
        $firstUnlock = $this->getFirstWordleUnlockTime($game);

        if ($now->lt($firstUnlock)) {
            return $firstUnlock;
        }

        $lastUnlock = $this->getLastWordleUnlockTime($game);

        return $lastUnlock->copy()->addHours($intervalHours);
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
