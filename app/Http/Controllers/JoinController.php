<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JoinController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:20',
        ]);

        $code = strtoupper(trim($request->code));

        // Check if it's an admin user code first
        $adminUser = User::where('code', $code)->where('is_admin', true)->first();
        if ($adminUser) {
            Auth::login($adminUser);

            return response()->json([
                'redirect' => '/admin',
            ]);
        }

        $player = Player::where('invite_code', $code)
            ->whereHas('game', fn ($q) => $q->whereIn('status', ['pending', 'active']))
            ->with('game')
            ->first();

        if (! $player) {
            return response()->json([
                'message' => 'Code ongeldig of spel niet actief',
            ], 422);
        }

        $user = User::where('email', $player->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Gebruiker niet gevonden',
            ], 422);
        }

        Auth::login($user);
        session(['player_id' => $player->id]);

        if (! $player->joined_at) {
            $player->update(['joined_at' => now()]);
        }

        return response()->json([
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
            ],
            'game' => [
                'id' => $player->game->id,
                'status' => $player->game->status,
            ],
        ]);
    }
}
