<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceSabotageRequest;
use App\Models\Player;
use App\Services\SabotageService;
use App\Services\TestGameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SabotageController extends Controller
{
    public function __construct(
        private SabotageService $sabotageService,
        private TestGameService $testGameService,
    ) {}

    public function place(PlaceSabotageRequest $request): JsonResponse
    {
        if ($this->testGameService->isTestMode()) {
            return $this->placeTestMode($request);
        }

        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 400);
        }

        $game = $player->game;

        if ($game->status !== 'active') {
            return response()->json(['error' => 'game_not_active'], 400);
        }

        $target = Player::where('id', $request->target_id)
            ->where('game_id', $player->game_id)
            ->first();

        if (! $target) {
            return response()->json(['error' => 'target_not_found'], 404);
        }

        $result = $this->sabotageService->placeSabotage($player, $target);

        if (! $result['success']) {
            $statusCodes = [
                'cannot_sabotage_self' => 422,
                'insufficient_points' => 400,
                'already_pending' => 422,
                'different_games' => 400,
            ];

            return response()->json(
                ['error' => $result['error']],
                $statusCodes[$result['error']] ?? 400
            );
        }

        $player->refresh();

        return response()->json([
            'success' => true,
            'points_remaining' => $player->points,
        ]);
    }

    public function reveal(Request $request): JsonResponse
    {
        if ($this->testGameService->isTestMode()) {
            return $this->revealTestMode();
        }

        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 400);
        }

        $result = $this->sabotageService->revealSabotages($player);

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 400);
        }

        $player->refresh();

        return response()->json([
            'success' => true,
            'sabotaged_question_ids' => $result['sabotaged_question_ids'],
            'points_remaining' => $player->points,
        ]);
    }

    private function placeTestMode(PlaceSabotageRequest $request): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];
        $cost = config('game.sabotage_cost');

        if ($player['points'] < $cost) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        if ($request->target_id === $player['id']) {
            return response()->json(['error' => 'cannot_sabotage_self'], 422);
        }

        $pendingSabotages = $testGame['pending_sabotages'] ?? [];

        // Check if already has pending sabotage on this target
        foreach ($pendingSabotages as $s) {
            if ($s['target_id'] === $request->target_id) {
                return response()->json(['error' => 'already_pending'], 422);
            }
        }

        $newPoints = $player['points'] - $cost;
        $pendingSabotages[] = [
            'target_id' => $request->target_id,
            'created_at' => now()->toISOString(),
        ];

        $this->testGameService->updateTestGame([
            'player' => ['points' => $newPoints],
            'pending_sabotages' => $pendingSabotages,
        ]);

        return response()->json([
            'success' => true,
            'points_remaining' => $newPoints,
        ]);
    }

    private function revealTestMode(): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];
        $cost = config('game.reveal_cost');

        if ($player['points'] < $cost) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $newPoints = $player['points'] - $cost;
        $sabotagedIds = $testGame['sabotaged_question_ids'] ?? [];

        $this->testGameService->updateTestGame([
            'player' => ['points' => $newPoints],
        ]);

        return response()->json([
            'success' => true,
            'sabotaged_question_ids' => $sabotagedIds,
            'points_remaining' => $newPoints,
        ]);
    }
}
