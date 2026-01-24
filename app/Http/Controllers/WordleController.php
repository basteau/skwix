<?php

namespace App\Http\Controllers;

use App\Models\WordleAttempt;
use App\Services\GameService;
use App\Services\WordleService;
use App\Services\WordlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WordleController extends Controller
{
    public function __construct(
        private GameService $gameService,
        private WordleService $wordleService,
        private WordlistService $wordlistService,
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return Inertia::render('play/wordle', [
                'error' => 'no_active_game',
            ]);
        }

        $game = $player->game;
        $dayNumber = $this->gameService->getDayNumber($game);

        $todayAttempt = WordleAttempt::where('game_id', $game->id)
            ->where('player_id', $player->id)
            ->where('day_number', $dayNumber)
            ->first();

        return Inertia::render('play/wordle', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
            ],
            'game' => [
                'id' => $game->id,
                'day_number' => $dayNumber,
            ],
            'wordle' => [
                'available' => $this->gameService->isWordleAvailable($game),
                'completed' => $todayAttempt?->completed ?? false,
                'guesses' => $todayAttempt?->guesses ?? [],
                'points_earned' => $todayAttempt?->points_earned ?? 0,
            ],
        ]);
    }

    public function guess(Request $request): JsonResponse
    {
        $request->validate([
            'guess' => 'required|string|size:5|alpha',
        ]);

        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 400);
        }

        $game = $player->game;

        if (! $this->gameService->isWordleAvailable($game)) {
            return response()->json(['error' => 'wordle_not_available'], 400);
        }

        $dayNumber = $this->gameService->getDayNumber($game);
        $targetWord = $this->gameService->getCurrentWordleWord($game);

        if (! $targetWord) {
            return response()->json(['error' => 'no_word_for_today'], 400);
        }

        $todayAttempt = WordleAttempt::firstOrCreate(
            [
                'game_id' => $game->id,
                'player_id' => $player->id,
                'day_number' => $dayNumber,
            ],
            [
                'guesses' => [],
                'completed' => false,
                'points_earned' => 0,
            ]
        );

        if ($todayAttempt->completed) {
            return response()->json(['error' => 'already_completed'], 400);
        }

        $guesses = $todayAttempt->guesses ?? [];
        if (count($guesses) >= 6) {
            return response()->json(['error' => 'max_guesses_reached'], 400);
        }

        $guess = strtolower(trim($request->guess));

        if (! $this->wordlistService->isValidWord($guess)) {
            return response()->json(['message' => 'Ongeldig woord'], 422);
        }

        $result = $this->wordleService->evaluateGuess($guess, $targetWord);

        $guesses[] = [
            'word' => $guess,
            'result' => $result,
        ];

        $isCorrect = $guess === $targetWord;
        $completed = $isCorrect || count($guesses) >= 6;
        $pointsEarned = 0;

        if ($completed) {
            $pointsEarned = $this->wordleService->calculatePoints(count($guesses), $isCorrect);
            $player->increment('points', $pointsEarned);
        }

        $todayAttempt->update([
            'guesses' => $guesses,
            'completed' => $completed,
            'points_earned' => $pointsEarned,
        ]);

        return response()->json([
            'result' => $result,
            'correct' => $isCorrect,
            'completed' => $completed,
            'points_earned' => $pointsEarned,
            'attempts_remaining' => 6 - count($guesses),
        ]);
    }
}
