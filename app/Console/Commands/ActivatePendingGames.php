<?php

namespace App\Console\Commands;

use App\Services\GameService;
use Illuminate\Console\Command;

class ActivatePendingGames extends Command
{
    protected $signature = 'game:activate-pending';

    protected $description = 'Activate games that have reached their start time';

    public function handle(GameService $gameService): int
    {
        $games = $gameService->getGamesNeedingActivation();

        if ($games->isEmpty()) {
            $this->info('No pending games to activate.');

            return self::SUCCESS;
        }

        foreach ($games as $game) {
            $gameService->activateGame($game);
            $this->info("Game #{$game->id} activated.");
        }

        return self::SUCCESS;
    }
}
