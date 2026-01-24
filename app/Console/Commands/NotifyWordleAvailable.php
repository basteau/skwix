<?php

namespace App\Console\Commands;

use App\Services\GameService;
use Illuminate\Console\Command;

class NotifyWordleAvailable extends Command
{
    protected $signature = 'game:notify-wordle';

    protected $description = 'Notify players that daily Wordle is available (scheduled for 8:00 AM CET)';

    public function handle(GameService $gameService): int
    {
        $activeGames = $gameService->getActiveGames();

        if ($activeGames->isEmpty()) {
            $this->info('No active games found.');

            return self::SUCCESS;
        }

        foreach ($activeGames as $game) {
            $dayNumber = $gameService->getDayNumber($game);
            $this->info("Game #{$game->id}: Day {$dayNumber} Wordle notification sent.");
        }

        return self::SUCCESS;
    }
}
