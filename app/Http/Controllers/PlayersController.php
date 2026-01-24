<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayersController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return Inertia::render('play/players', [
                'error' => 'no_active_game',
            ]);
        }

        $game = $player->game;

        $players = Player::where('game_id', $game->id)
            ->withCount(['questions', 'wordleAttempts'])
            ->with(['wordleAttempts' => fn ($q) => $q->where('completed', true)])
            ->orderByDesc('points')
            ->get()
            ->map(function ($p, $index) use ($player) {
                $completedWordles = $p->wordleAttempts->filter(fn ($a) => $a->completed);
                $avgGuesses = $completedWordles->isNotEmpty()
                    ? round($completedWordles->avg(fn ($a) => count($a->guesses ?? [])), 1)
                    : null;

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'avatar_url' => $p->avatar_url,
                    'points' => $p->points,
                    'rank' => $index + 1,
                    'questions_count' => $p->questions_count,
                    'wordles_completed' => $completedWordles->count(),
                    'avg_wordle_guesses' => $avgGuesses,
                    'is_current' => $p->id === $player->id,
                ];
            });

        return Inertia::render('play/players', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
            ],
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
            ],
            'players' => $players,
        ]);
    }
}
