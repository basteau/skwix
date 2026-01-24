<?php

namespace App\Services;

use App\Mail\GameEnded;
use App\Models\Game;
use Illuminate\Support\Facades\Mail;

class GameEndedNotificationService
{
    public function notifyAllPlayers(Game $game): int
    {
        $game->load(['players', 'winner']);
        $players = $game->players->sortByDesc('points');
        $totalPlayers = $players->count();
        $notified = 0;

        foreach ($players as $index => $player) {
            $rank = $index + 1;

            Mail::to($player->email)->queue(
                new GameEnded(
                    recipient: $player,
                    game: $game,
                    winner: $game->winner,
                    rank: $rank,
                    totalPlayers: $totalPlayers,
                )
            );

            $notified++;
        }

        return $notified;
    }
}
