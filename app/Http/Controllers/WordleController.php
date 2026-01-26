<?php

namespace App\Http\Controllers;

use App\Models\WordleAttempt;
use App\Services\GameService;
use App\Services\TestGameService;
use App\Services\WordleService;
use App\Services\WordlistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WordleController extends Controller
{
    public function __construct(
        private GameService $gameService,
        private WordleService $wordleService,
        private WordlistService $wordlistService,
        private TestGameService $testGameService,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        if ($this->testGameService->isTestMode()) {
            return $this->showTestMode();
        }

        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return redirect('/lobby');
        }

        $game = $player->game;
        $dayNumber = $this->gameService->getDayNumber($game);

        $todayAttempt = WordleAttempt::where('game_id', $game->id)
            ->where('player_id', $player->id)
            ->where('day_number', $dayNumber)
            ->first();

        $targetWord = $this->gameService->getCurrentWordleWord($game);
        $lastGuess = ! empty($todayAttempt?->guesses) ? $todayAttempt->guesses[count($todayAttempt->guesses) - 1]['word'] ?? null : null;
        $wasSuccessful = $todayAttempt?->completed && $lastGuess === $targetWord;

        $isAvailable = $this->gameService->isWordleAvailable($game);

        return Inertia::render('play/wordle', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
                'avatar_url' => $player->avatar_url,
            ],
            'game' => [
                'id' => $game->id,
                'day_number' => $dayNumber,
                'status' => $game->status,
            ],
            'wordle' => [
                'available' => $isAvailable,
                'completed' => $todayAttempt?->completed ?? false,
                'guesses' => $todayAttempt?->guesses ?? [],
                'points_earned' => $todayAttempt?->points_earned ?? 0,
                'was_successful' => $wasSuccessful,
                'target_word' => $todayAttempt?->completed ? $targetWord : null,
                'next_unlock_at' => ! $isAvailable ? $this->gameService->getNextWordleUnlockTime($game)->toISOString() : null,
            ],
        ]);
    }

    private function showTestMode(): Response
    {
        $testGame = $this->testGameService->getTestGame();
        $dayNumber = $this->testGameService->getDayNumber();
        $wordleWord = $this->testGameService->getWordleWord($dayNumber);
        $guesses = $testGame['wordle']['guesses'] ?? [];
        $lastGuess = ! empty($guesses) ? $guesses[count($guesses) - 1]['word'] ?? null : null;
        $wasSuccessful = $testGame['wordle']['completed'] && $lastGuess === $wordleWord;

        return Inertia::render('play/wordle', [
            'testMode' => [
                'active' => true,
                'wordleWord' => $wordleWord,
            ],
            'player' => $testGame['player'],
            'game' => [
                'id' => $testGame['id'],
                'day_number' => $dayNumber,
                'status' => 'active',
            ],
            'wordle' => [
                'available' => true,
                'completed' => $testGame['wordle']['completed'],
                'guesses' => $guesses,
                'points_earned' => $testGame['wordle']['points_earned'],
                'was_successful' => $wasSuccessful,
                'target_word' => $testGame['wordle']['completed'] ? $wordleWord : null,
            ],
        ]);
    }

    public function guess(Request $request): JsonResponse
    {
        $request->validate([
            'guess' => 'required|string|size:5|alpha',
        ]);

        if ($this->testGameService->isTestMode()) {
            return $this->guessTestMode($request);
        }

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

    private function guessTestMode(Request $request): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();

        if ($testGame['wordle']['completed']) {
            return response()->json(['error' => 'already_completed'], 400);
        }

        $guesses = $testGame['wordle']['guesses'];
        if (count($guesses) >= 6) {
            return response()->json(['error' => 'max_guesses_reached'], 400);
        }

        $guess = strtolower(trim($request->guess));
        $dayNumber = $this->testGameService->getDayNumber();
        $targetWord = $this->testGameService->getWordleWord($dayNumber);

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
            $this->testGameService->updateTestGame([
                'player' => ['points' => $testGame['player']['points'] + $pointsEarned],
            ]);
        }

        $this->testGameService->updateTestGame([
            'wordle' => [
                'guesses' => $guesses,
                'completed' => $completed,
                'points_earned' => $pointsEarned,
            ],
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
