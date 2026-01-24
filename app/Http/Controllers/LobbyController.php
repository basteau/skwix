<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LobbyController extends Controller
{
    public function show(Request $request): Response
    {
        $playerId = session('player_id');

        if (! $playerId) {
            return Inertia::render('welcome');
        }

        $player = Player::with('game.players')->find($playerId);

        if (! $player) {
            session()->forget('player_id');

            return Inertia::render('welcome');
        }

        $game = $player->game;
        $joinedPlayers = $game->players()
            ->whereNotNull('joined_at')
            ->get(['id', 'name', 'avatar_url']);

        return Inertia::render('lobby', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
            ],
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
                'starts_at' => $game->starts_at?->toIso8601String(),
            ],
            'players' => $joinedPlayers->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'avatar_url' => $p->avatar_url,
            ])->values(),
        ]);
    }
}
