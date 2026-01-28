<?php

namespace App\Http\Controllers;

use App\Models\GameNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function dismiss(Request $request, GameNotification $notification): JsonResponse
    {
        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 400);
        }

        // Verify notification belongs to player's game
        if ($notification->game_id !== $player->game_id) {
            return response()->json(['error' => 'invalid_notification'], 400);
        }

        // Check if already dismissed
        if ($notification->isDismissedBy($player)) {
            return response()->json(['success' => true, 'already_dismissed' => true]);
        }

        // Add to pivot table
        $notification->dismissedByPlayers()->attach($player->id, [
            'dismissed_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }
}
