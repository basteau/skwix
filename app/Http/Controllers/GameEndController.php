<?php

namespace App\Http\Controllers;

use App\Services\TestGameService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameEndController extends Controller
{
    public function __construct(
        private TestGameService $testGameService,
    ) {}

    public function end(Request $request): RedirectResponse
    {
        // Test mode - always go to win screen for testing
        if ($this->testGameService->isTestMode()) {
            return redirect()->route('win');
        }

        $player = $request->user()->players()
            ->whereHas('game', fn ($q) => $q->where('status', 'completed'))
            ->with(['game.winner'])
            ->latest()
            ->first();

        if (! $player || ! $player->game->winner) {
            return redirect()->route('play.wordle');
        }

        return $player->game->winner->id === $player->id
            ? redirect()->route('win')
            : redirect()->route('lose');
    }

    public function win(Request $request): Response|RedirectResponse
    {
        // Test mode support
        if ($this->testGameService->isTestMode()) {
            return $this->winTestMode();
        }

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

    private function winTestMode(): Response
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];

        return Inertia::render('win', [
            'winner' => [
                'id' => $player['id'],
                'name' => $player['name'],
                'avatar_url' => $player['avatar_url'] ?? null,
                'points' => $player['points'],
            ],
            'game' => [
                'id' => $testGame['id'],
                'secret_word' => $testGame['secret_word'],
            ],
            'prizeUrl' => config('app.prize_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
            'testMode' => ['active' => true],
        ]);
    }

    public function lose(Request $request): Response|RedirectResponse
    {
        // Test mode support
        if ($this->testGameService->isTestMode()) {
            return $this->loseTestMode();
        }

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

    private function loseTestMode(): Response
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];
        $allPlayers = $this->testGameService->getAllPlayers();

        // Find a fake winner (first fake player with highest points)
        $fakePlayers = $testGame['fake_players'] ?? [];
        $winner = ! empty($fakePlayers) ? $fakePlayers[0] : $player;

        // Calculate rank
        $rank = 1;
        foreach ($allPlayers as $index => $p) {
            if ($p['id'] === $player['id']) {
                $rank = $index + 1;
                break;
            }
        }

        return Inertia::render('lose', [
            'winner' => [
                'id' => $winner['id'],
                'name' => $winner['name'],
                'avatar_url' => $winner['avatar_url'] ?? null,
            ],
            'player' => [
                'id' => $player['id'],
                'name' => $player['name'],
                'points' => $player['points'],
                'rank' => $rank,
            ],
            'game' => [
                'id' => $testGame['id'],
                'secret_word' => $testGame['secret_word'],
                'total_players' => count($allPlayers),
            ],
            'testMode' => ['active' => true],
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
