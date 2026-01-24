<?php

namespace App\Services;

use App\Models\Game;
use App\Models\Player;
use Carbon\Carbon;

class GameService
{
    public function isWordleAvailable(Game $game): bool
    {
        $now = Carbon::now('Europe/Amsterdam');
        $unlockTime = $now->copy()->setTime(8, 0, 0);

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

        $startDate = $game->starts_at->copy()->setTimezone('Europe/Amsterdam')->startOfDay();
        $today = Carbon::now('Europe/Amsterdam')->startOfDay();

        return (int) $startDate->diffInDays($today) + 1;
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
        $secretWord = strtolower(trim($game->secret_word));
        $guessWord = strtolower(trim($guess));

        return $secretWord === $guessWord;
    }

    public function setWinner(Game $game, Player $player): Game
    {
        $game->winner_id = $player->id;
        $game->status = 'completed';
        $game->ends_at = Carbon::now();
        $game->save();

        return $game;
    }

    public function activateGame(Game $game): Game
    {
        if ($game->status !== 'pending') {
            return $game;
        }

        $now = Carbon::now();
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
}
