<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Services\GameService;
use App\Services\OpenRouterService;
use App\Services\TestGameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuessController extends Controller
{
    public function __construct(
        private GameService $gameService,
        private OpenRouterService $openRouterService,
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
            return Inertia::render('play/guess', [
                'error' => 'no_active_game',
            ]);
        }

        $game = $player->game;

        $questionsQuery = Question::where('game_id', $game->id)
            ->with('player:id,name,avatar_url')
            ->orderBy('created_at', 'asc');

        if (! $user->is_admin) {
            $questionsQuery->where('player_id', $player->id);
        }

        $questions = $questionsQuery->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'question' => $q->question_text,
                'answer' => $q->answer,
                'player' => [
                    'id' => $q->player->id,
                    'name' => $q->player->name,
                    'avatar_url' => $q->player->avatar_url,
                ],
                'created_at' => $q->created_at->toISOString(),
            ]);

        return Inertia::render('play/guess', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
            ],
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
            ],
            'questions' => $questions,
        ]);
    }

    private function showTestMode(): Response
    {
        $testGame = $this->testGameService->getTestGame();

        return Inertia::render('play/guess', [
            'testMode' => ['active' => true, 'secretWord' => $testGame['secret_word']],
            'player' => $testGame['player'],
            'game' => [
                'id' => $testGame['id'],
                'status' => 'active',
            ],
            'questions' => collect($testGame['questions'] ?? [])->map(fn ($q, $idx) => [
                'id' => $idx + 1,
                'question' => $q['question'],
                'answer' => $q['answer'],
                'player' => [
                    'id' => $testGame['player']['id'],
                    'name' => $testGame['player']['name'],
                    'avatar_url' => $testGame['player']['avatar_url'] ?? null,
                ],
                'created_at' => now()->subMinutes(count($testGame['questions'] ?? []) - $idx)->toISOString(),
            ]),
        ]);
    }

    public function ask(Request $request): JsonResponse
    {
        $request->validate([
            'question' => 'required|string|min:3|max:500',
        ]);

        if ($this->testGameService->isTestMode()) {
            return $this->askTestMode($request);
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

        if ($player->points < 3) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $question = trim($request->question);

        $result = $this->openRouterService->askQuestion($game->secret_word, $question);

        if (! $result['success']) {
            return response()->json([
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        $savedQuestion = \DB::transaction(function () use ($game, $player, $question, $result) {
            $player->decrement('points', 3);

            return Question::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'question_text' => $question,
                'answer' => $result['answer'],
            ]);
        });

        $player->refresh();

        return response()->json([
            'success' => true,
            'question' => [
                'id' => $savedQuestion->id,
                'question' => $savedQuestion->question_text,
                'answer' => $savedQuestion->answer,
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'avatar_url' => $player->avatar_url,
                ],
                'created_at' => $savedQuestion->created_at->toISOString(),
            ],
            'points_remaining' => $player->points,
        ]);
    }

    private function askTestMode(Request $request): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];

        if ($player['points'] < 3) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $question = trim($request->question);
        $secretWord = $testGame['secret_word'];

        $result = $this->openRouterService->askQuestion($secretWord, $question);

        if (! $result['success']) {
            return response()->json([
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        $newPoints = $player['points'] - 3;
        $questions = $testGame['questions'] ?? [];
        $newQuestion = [
            'question' => $question,
            'answer' => $result['answer'],
        ];
        $questions[] = $newQuestion;

        $this->testGameService->updateTestGame([
            'player' => ['points' => $newPoints],
            'questions' => $questions,
        ]);

        return response()->json([
            'success' => true,
            'question' => [
                'id' => count($questions),
                'question' => $question,
                'answer' => $result['answer'],
                'player' => [
                    'id' => $player['id'],
                    'name' => $player['name'],
                    'avatar_url' => $player['avatar_url'] ?? null,
                ],
                'created_at' => now()->toISOString(),
            ],
            'points_remaining' => $newPoints,
        ]);
    }
}
