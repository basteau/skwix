<?php

namespace App\Observers;

use App\Models\Game;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GameObserver
{
    public function deleting(Game $game): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        $playerEmails = $game->players()->pluck('email')->toArray();

        if (empty($playerEmails)) {
            return;
        }

        $userIds = User::whereIn('email', $playerEmails)
            ->where('is_admin', false)
            ->pluck('id')
            ->toArray();

        if (empty($userIds)) {
            return;
        }

        DB::table('sessions')
            ->whereIn('user_id', $userIds)
            ->delete();
    }
}
