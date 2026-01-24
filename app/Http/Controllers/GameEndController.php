<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameEndController extends Controller
{
    public function win(Request $request): Response|RedirectResponse
    {
        [$player, $game, $winner] = $this->getCompletedGameContext($request);

        if (! $player || ! $winner) {
            return redirect()->route('play.wordle');
        }

        if ($winner->id !== $player->id) {
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

    public function lose(Request $request): Response|RedirectResponse
    {
        [$player, $game, $winner] = $this->getCompletedGameContext($request);

        if (! $player || ! $winner) {
            return redirect()->route('play.wordle');
        }

        if ($winner->id === $player->id) {
            return redirect()->route('win');
        }

        $allPlayers = $game->players()->orderByDesc('points')->get();

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
                'rank' => $allPlayers->search(fn ($p) => $p->id === $player->id) + 1,
            ],
            'game' => [
                'id' => $game->id,
                'secret_word' => $game->secret_word,
                'total_players' => $allPlayers->count(),
            ],
        ]);
    }

    private function getCompletedGameContext(Request $request): array
    {
        $player = $request->user()->players()
            ->whereHas('game', fn ($q) => $q->where('status', 'completed'))
            ->with(['game.winner'])
            ->latest()
            ->first();

        if (! $player) {
            return [null, null, null];
        }

        return [$player, $player->game, $player->game->winner];
    }
}
