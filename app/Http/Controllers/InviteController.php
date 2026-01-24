<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InviteController extends Controller
{
    public function validate(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:20',
        ]);

        $code = strtoupper(trim($request->code));

        $player = Player::where('invite_code', $code)
            ->whereNull('joined_at')
            ->first();

        if (! $player) {
            return response()->json([
                'valid' => false,
                'message' => 'Code ongeldig of al gebruikt',
            ]);
        }

        // Mark player as joined
        $player->update(['joined_at' => now()]);

        // Store player ID in session for lobby access
        session(['player_id' => $player->id]);

        return response()->json([
            'valid' => true,
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
            ],
        ]);
    }
}
