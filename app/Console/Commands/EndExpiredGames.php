<?php

namespace App\Console\Commands;

use App\Services\GameService;
use Illuminate\Console\Command;

class EndExpiredGames extends Command
{
    protected $signature = 'game:end-expired';

    protected $description = 'End games that have reached their end time';

    public function handle(GameService $gameService): int
    {
        $games = $gameService->getGamesNeedingEnding();

        if ($games->isEmpty()) {
            $this->info('No expired games to end.');

            return self::SUCCESS;
        }

        foreach ($games as $game) {
            $result = $gameService->endExpiredGame($game);
            if ($result['winner']) {
                $this->info("Game #{$game->id} ended. Winner: {$result['winner']->name} ({$result['winner']->points} pts)");
            } else {
                $this->info("Game #{$game->id} ended. No winner (tie or no players).");
            }
        }

        return self::SUCCESS;
    }
}
