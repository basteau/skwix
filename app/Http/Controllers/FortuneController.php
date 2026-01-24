<?php

namespace App\Http\Controllers;

use App\Models\SpinResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FortuneController extends Controller
{
    private const SEGMENTS = 8;

    public function show(Request $request): Response
    {
        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return Inertia::render('play/fortune', [
                'error' => 'no_active_game',
            ]);
        }

        $game = $player->game;

        $recentSpins = SpinResult::where('game_id', $game->id)
            ->where('player_id', $player->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn ($spin) => [
                'id' => $spin->id,
                'amount' => $spin->amount_wagered,
                'won' => $spin->won,
                'points_change' => $spin->points_change,
                'created_at' => $spin->created_at->toISOString(),
            ]);

        return Inertia::render('play/fortune', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
            ],
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
            ],
            'recentSpins' => $recentSpins,
        ]);
    }

    public function spin(Request $request): JsonResponse
    {
        $request->validate([
            'wager' => 'required|integer|min:1',
        ]);

        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 400);
        }

        $game = $player->game;

        if ($game->status !== 'active') {
            return response()->json(['error' => 'game_not_active'], 400);
        }

        $wager = (int) $request->wager;

        if ($wager > $player->points) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $won = $this->spinWheel();
        $pointsChange = $won ? $wager : -$wager;

        $spinResult = \DB::transaction(function () use ($game, $player, $wager, $won, $pointsChange) {
            $player->increment('points', $pointsChange);

            return SpinResult::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'amount_wagered' => $wager,
                'won' => $won,
                'points_change' => $pointsChange,
            ]);
        });

        $player->refresh();

        $landingSegment = $this->getLandingSegment($won);
        $rotations = random_int(3, 5);
        $segmentAngle = 360 / self::SEGMENTS;
        $spinDegrees = ($rotations * 360) + ($landingSegment * $segmentAngle) + random_int(5, (int) $segmentAngle - 5);

        return response()->json([
            'success' => true,
            'won' => $won,
            'points_change' => $pointsChange,
            'points_remaining' => $player->points,
            'spin_degrees' => $spinDegrees,
            'spin_result' => [
                'id' => $spinResult->id,
                'amount' => $spinResult->amount_wagered,
                'won' => $spinResult->won,
                'points_change' => $spinResult->points_change,
            ],
        ]);
    }

    private function spinWheel(): bool
    {
        // Use fake fortune service for deterministic E2E tests
        if (config('e2e.fortune_driver') === 'fake') {
            return app(\App\Services\FakeFortuneService::class)->spin();
        }

        return (bool) random_int(0, 1);
    }

    private function getLandingSegment(bool $won): int
    {
        $winSegments = [0, 2, 4, 6];
        $loseSegments = [1, 3, 5, 7];

        $segments = $won ? $winSegments : $loseSegments;

        return $segments[array_rand($segments)];
    }
}
