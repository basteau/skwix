<?php

namespace App\Http\Controllers;

use App\Models\GameNotification;
use App\Models\SpinResult;
use App\Services\TestGameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FortuneController extends Controller
{
    private const SEGMENTS = 8;

    public function __construct(
        private TestGameService $testGameService,
    ) {}

    public function show(Request $request): Response
    {
        if ($this->testGameService->isTestMode()) {
            return $this->showTestMode();
        }

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

        // Get active notifications that the player hasn't dismissed
        $notifications = GameNotification::getActiveForPlayer($player);

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
            'notifications' => $notifications,
        ]);
    }

    private function showTestMode(): Response
    {
        $testGame = $this->testGameService->getTestGame();

        return Inertia::render('play/fortune', [
            'testMode' => ['active' => true],
            'player' => $testGame['player'],
            'game' => [
                'id' => $testGame['id'],
                'status' => 'active',
            ],
            'recentSpins' => $testGame['spins'] ?? [],
        ]);
    }

    public function spin(Request $request): JsonResponse
    {
        $request->validate([
            'wager' => 'required|integer|min:1',
            'current_rotation' => 'nullable|numeric|min:0',
        ]);

        if ($this->testGameService->isTestMode()) {
            return $this->spinTestMode($request);
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

        $wager = (int) $request->wager;

        $won = $this->spinWheel();
        $pointsChange = $won ? $wager : -$wager;

        $result = \DB::transaction(function () use ($game, $player, $wager, $won, $pointsChange) {
            $lockedPlayer = \App\Models\Player::where('id', $player->id)->lockForUpdate()->first();

            if ($wager > $lockedPlayer->points) {
                return ['error' => 'insufficient_points'];
            }

            $newPoints = max(0, $lockedPlayer->points + $pointsChange);
            $actualPointsChange = $newPoints - $lockedPlayer->points;

            $lockedPlayer->update(['points' => $newPoints]);

            $spinResult = SpinResult::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'amount_wagered' => $wager,
                'won' => $won,
                'points_change' => $actualPointsChange,
            ]);

            return ['spinResult' => $spinResult, 'player' => $lockedPlayer];
        });

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], 400);
        }

        $spinResult = $result['spinResult'];
        $player = $result['player'];

        $currentRotation = (float) ($request->current_rotation ?? 0);
        $spinDegrees = $this->calculateSpinDegrees($won, $currentRotation);

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

    private function spinTestMode(Request $request): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();
        $wager = (int) $request->wager;
        $points = $testGame['player']['points'];

        if ($wager > $points) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $won = $this->spinWheel();
        $pointsChange = $won ? $wager : -$wager;
        $newPoints = max(0, $points + $pointsChange);
        $pointsChange = $newPoints - $points;

        $spinResult = [
            'id' => random_int(10000, 99999),
            'amount' => $wager,
            'won' => $won,
            'points_change' => $pointsChange,
            'created_at' => now()->toISOString(),
        ];

        $existingSpins = $testGame['spins'] ?? [];
        array_unshift($existingSpins, $spinResult);
        $recentSpins = array_slice($existingSpins, 0, 5);

        $this->testGameService->updateTestGame([
            'player' => ['points' => $newPoints],
            'spins' => $recentSpins,
        ]);

        $currentRotation = (float) ($request->current_rotation ?? 0);
        $spinDegrees = $this->calculateSpinDegrees($won, $currentRotation);

        return response()->json([
            'success' => true,
            'won' => $won,
            'points_change' => $pointsChange,
            'points_remaining' => $newPoints,
            'spin_degrees' => $spinDegrees,
            'spin_result' => $spinResult,
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

    private function calculateSpinDegrees(bool $won, float $currentRotation = 0): int
    {
        $landingSegment = $this->getLandingSegment($won);
        $rotations = random_int(3, 5);
        $segmentAngle = 360 / self::SEGMENTS;

        // The wheel is drawn with segment 0 starting at top (-90°), meaning the TOP pointer
        // sits on the BOUNDARY between segment 7 and segment 0 when rotation = 0.
        //
        // After clockwise rotation by X degrees, the segment under the top pointer is:
        //   (SEGMENTS - 1 - floor(X / segmentAngle)) % SEGMENTS
        //
        // To land on landingSegment, we need:
        //   floor(finalRotation / segmentAngle) % SEGMENTS = (SEGMENTS - 1 - landingSegment) % SEGMENTS
        //
        // So the target rotation (mod 360) should put us in the correct segment range.

        $targetSegmentIndex = ((self::SEGMENTS - 1 - $landingSegment) + self::SEGMENTS) % self::SEGMENTS;
        $targetSegmentPosition = $targetSegmentIndex * $segmentAngle;

        // Add random offset within the segment (not too close to edges to avoid ambiguity)
        $offsetWithinSegment = random_int(8, (int) $segmentAngle - 8);
        $targetFinalRotation = $targetSegmentPosition + $offsetWithinSegment;

        // Calculate how much we need to spin from current position
        // We want: (currentRotation + spinDegrees) mod 360 = targetFinalRotation
        // Plus multiple full rotations for visual effect
        $baseRotation = $rotations * 360;

        // Normalize current rotation to 0-360
        $normalizedCurrent = fmod($currentRotation, 360);
        if ($normalizedCurrent < 0) {
            $normalizedCurrent += 360;
        }

        // Calculate the spin needed to reach target position
        $spinToTarget = $targetFinalRotation - $normalizedCurrent;
        if ($spinToTarget <= 0) {
            $spinToTarget += 360; // Ensure we spin forward
        }

        return (int) ($baseRotation + $spinToTarget);
    }

    private function getLandingSegment(bool $won): int
    {
        // Segments 0, 2, 4, 6 are WIN (labeled "2×")
        // Segments 1, 3, 5, 7 are LOSE (labeled "0×")
        $winSegments = [0, 2, 4, 6];
        $loseSegments = [1, 3, 5, 7];

        $segments = $won ? $winSegments : $loseSegments;

        return $segments[array_rand($segments)];
    }
}
