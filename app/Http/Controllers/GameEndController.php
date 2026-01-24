<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameEndController extends Controller
{
    public function win(Request $request): Response
    {
        $user = $request->user();
        $player = $user->players()
            ->whereHas('game', fn ($q) => $q->where('status', 'completed'))
            ->with(['game.winner'])
            ->latest()
            ->first();

        if (! $player || ! $player->game->winner) {
            return redirect()->route('play.wordle');
        }

        $game = $player->game;
        $winner = $game->winner;

        $isWinner = $winner->id === $player->id;

        if (! $isWinner) {
            return redirect()->route('lose');
        }

        return Inertia::render('win', [
            'winner' => [
                'id' => $winner->id,
                'name' => $winner->name,
                'avatar_url' => $winner->avatar_url,
                'points' => $winner->points,
            ],
            'game' => [
                'id' => $game->id,
                'secret_word' => $game->secret_word,
            ],
            'prizeUrl' => config('app.prize_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        ]);
    }

    public function lose(Request $request): Response
    {
        $user = $request->user();
        $player = $user->players()
            ->whereHas('game', fn ($q) => $q->where('status', 'completed'))
            ->with(['game.winner'])
            ->latest()
            ->first();

        if (! $player || ! $player->game->winner) {
            return redirect()->route('play.wordle');
        }

        $game = $player->game;
        $winner = $game->winner;

        $isWinner = $winner->id === $player->id;

        if ($isWinner) {
            return redirect()->route('win');
        }

        $allPlayers = $game->players()->orderByDesc('points')->get();
        $totalPlayers = $allPlayers->count();
        $rank = $allPlayers->search(fn ($p) => $p->id === $player->id) + 1;

        return Inertia::render('lose', [
            'winner' => [
                'id' => $winner->id,
                'name' => $winner->name,
                'avatar_url' => $winner->avatar_url,
            ],
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
                'rank' => $rank,
            ],
            'game' => [
                'id' => $game->id,
                'secret_word' => $game->secret_word,
                'total_players' => $totalPlayers,
            ],
        ]);
    }
}
