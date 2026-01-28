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

    protected $description = 'Notify players that Wordle is available (runs every minute, sends once per wordle unlock)';

    public function handle(GameService $gameService): int
    {
        $now = Carbon::now('Europe/Brussels');

        if ($now->minute !== 0) {
            return self::SUCCESS;
        }

        $currentHour = $now->hour;

        $games = Game::where('status', 'active')->get();

        if ($games->isEmpty()) {
            $this->info('No active games.');

            return self::SUCCESS;
        }

        foreach ($games as $game) {
            if (! $this->isWordleUnlockHour($game, $currentHour)) {
                continue;
            }

            $wordleNumber = $gameService->getWordleNumber($game);
            $cacheKey = "wordle_notify:{$game->id}:{$wordleNumber}";

            if (Cache::has($cacheKey)) {
                $this->info("Game #{$game->id}: Already notified for wordle #{$wordleNumber}.");

                continue;
            }

            $intervalHours = $game->wordle_interval_hours ?? 24;
            Cache::put($cacheKey, true, now()->addHours($intervalHours + 2));

            $this->info("Game #{$game->id}: Wordle #{$wordleNumber} notification sent (interval: {$intervalHours}h).");
        }

        return self::SUCCESS;
    }

    private function isWordleUnlockHour(Game $game, int $currentHour): bool
    {
        $wordleHour = $game->wordle_hour ?? 8;
        $intervalHours = $game->wordle_interval_hours ?? 24;

        $unlockHours = [];
        $hour = $wordleHour;

        for ($i = 0; $i < 24 / $intervalHours; $i++) {
            $unlockHours[] = $hour % 24;
            $hour += $intervalHours;
        }

        return in_array($currentHour, $unlockHours, true);
    }
}
