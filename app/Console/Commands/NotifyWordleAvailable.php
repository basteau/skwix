<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\GameService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class NotifyWordleAvailable extends Command
{
    protected $signature = 'game:notify-wordle';

    protected $description = 'Notify players that daily Wordle is available (runs every minute, sends once per game per day)';

    public function handle(GameService $gameService): int
    {
        $now = Carbon::now('Europe/Brussels');

        if ($now->minute !== 0) {
            return self::SUCCESS;
        }

        $currentHour = $now->hour;
        $today = $now->toDateString();

        $games = Game::where('status', 'active')
            ->where('wordle_hour', $currentHour)
            ->get();

        if ($games->isEmpty()) {
            $this->info("No active games with wordle_hour={$currentHour}.");

            return self::SUCCESS;
        }

        foreach ($games as $game) {
            $cacheKey = "wordle_notify:{$game->id}:{$today}";

            if (Cache::has($cacheKey)) {
                $this->info("Game #{$game->id}: Already notified today.");

                continue;
            }

            Cache::put($cacheKey, true, now()->addHours(26));

            $dayNumber = $gameService->getDayNumber($game);
            $this->info("Game #{$game->id}: Day {$dayNumber} Wordle notification sent.");
        }

        return self::SUCCESS;
    }
}
