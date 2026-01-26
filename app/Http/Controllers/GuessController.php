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
                'wit' => $q->wit,
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
                'winner_id' => $game->winner_id,
                'secret_word_length' => mb_strlen($game->secret_word),
            ],
            'questions' => $questions,
            'isAdmin' => $user->is_admin,
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
                'secret_word_length' => mb_strlen($testGame['secret_word']),
            ],
            'questions' => collect($testGame['questions'] ?? [])->map(fn ($q, $idx) => [
                'id' => $idx + 1,
                'question' => $q['question'],
                'answer' => $q['answer'],
                'wit' => $q['wit'] ?? null,
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

        if ($player->points < config('game.guess_cost')) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $question = trim($request->question);

        // First, classify the question to detect direct word guesses
        $classification = $this->openRouterService->classifyQuestion($question);

        if (! $classification['success']) {
            return response()->json([
                'error' => 'ai_error',
                'message' => $classification['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        // Handle multi-guess attempts (listing multiple words)
        if ($classification['type'] === 'multi_guess') {
            return response()->json([
                'error' => 'multi_guess',
                'message' => 'Je kunt maar één woord tegelijk raden. Probeer: "Is het woord [jouw gok]?"',
            ], 422);
        }

        // Handle direct word guess
        if ($classification['type'] === 'direct_guess') {
            return $this->handleDirectGuess($game, $player, $question, $classification['guessed_word']);
        }

        // Regular property question - proceed with normal Q&A flow
        $result = $this->openRouterService->askQuestion($game->secret_word, $question);

        if (! $result['success']) {
            return response()->json([
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        $answer = $result['answer'];
        $wit = $result['wit'] ?? null;
        $isUnknown = $answer === 'unknown';

        // Don't deduct points for unknown responses - save question for tracking but no cost
        $savedQuestion = \DB::transaction(function () use ($game, $player, $question, $answer, $wit, $isUnknown) {
            if (! $isUnknown) {
                $player->decrement('points', config('game.guess_cost'));
            }

            return Question::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'question_text' => $question,
                'answer' => $answer,
                'wit' => $wit,
            ]);
        });

        $player->refresh();

        return response()->json([
            'success' => true,
            'question' => [
                'id' => $savedQuestion->id,
                'question' => $savedQuestion->question_text,
                'answer' => $savedQuestion->answer,
                'wit' => $savedQuestion->wit,
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'avatar_url' => $player->avatar_url,
                ],
                'created_at' => $savedQuestion->created_at->toISOString(),
            ],
            'points_remaining' => $player->points,
            'free_question' => $isUnknown,
        ]);
    }

    private function handleDirectGuess($game, $player, string $question, string $guessedWord): JsonResponse
    {
        $isCorrect = $this->gameService->checkWin($game, $player, $guessedWord);
        $answerType = $isCorrect ? 'winner' : 'no';

        // Generate Boma-style wit for the guess result
        $wit = $this->openRouterService->generateBomaWit($answerType, $question);

        // Deduct points and save the question
        $savedQuestion = \DB::transaction(function () use ($game, $player, $question, $answerType, $guessedWord, $wit) {
            $player->decrement('points', config('game.guess_cost'));

            return Question::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'question_text' => $question,
                'answer' => $answerType,
                'wit' => $wit,
                'guessed_word' => $guessedWord,
            ]);
        });

        $player->refresh();

        if ($isCorrect) {
            // Set this player as the winner!
            $this->gameService->setWinner($game, $player);

            return response()->json([
                'success' => true,
                'winner' => true,
                'question' => [
                    'id' => $savedQuestion->id,
                    'question' => $savedQuestion->question_text,
                    'answer' => 'winner',
                    'wit' => $savedQuestion->wit,
                    'player' => [
                        'id' => $player->id,
                        'name' => $player->name,
                        'avatar_url' => $player->avatar_url,
                    ],
                    'created_at' => $savedQuestion->created_at->toISOString(),
                ],
                'points_remaining' => $player->points,
                'game' => [
                    'secret_word' => $game->secret_word,
                ],
                'winner_data' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'avatar_url' => $player->avatar_url,
                    'points' => $player->points,
                ],
                'prize_url' => config('app.prize_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
            ]);
        }

        // Wrong guess
        return response()->json([
            'success' => true,
            'winner' => false,
            'question' => [
                'id' => $savedQuestion->id,
                'question' => $savedQuestion->question_text,
                'answer' => 'no',
                'wit' => $savedQuestion->wit,
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'avatar_url' => $player->avatar_url,
                ],
                'created_at' => $savedQuestion->created_at->toISOString(),
            ],
            'points_remaining' => $player->points,
            'wrong_guess' => true,
            'guessed_word' => $guessedWord,
        ]);
    }

    private function askTestMode(Request $request): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];

        if ($player['points'] < config('game.guess_cost')) {
            return response()->json(['error' => 'insufficient_points'], 400);
        }

        $question = trim($request->question);
        $secretWord = $testGame['secret_word'];

        // First, classify the question
        $classification = $this->openRouterService->classifyQuestion($question);

        if (! $classification['success']) {
            return response()->json([
                'error' => 'ai_error',
                'message' => $classification['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        // Handle multi-guess attempts
        if ($classification['type'] === 'multi_guess') {
            return response()->json([
                'error' => 'multi_guess',
                'message' => 'Je kunt maar één woord tegelijk raden. Probeer: "Is het woord [jouw gok]?"',
            ], 422);
        }

        // Handle direct word guess in test mode
        if ($classification['type'] === 'direct_guess') {
            $guessedWord = $classification['guessed_word'];
            $isCorrect = strtolower($guessedWord) === strtolower($secretWord);

            $newPoints = $player['points'] - config('game.guess_cost');
            $questions = $testGame['questions'] ?? [];
            $newQuestion = [
                'question' => $question,
                'answer' => $isCorrect ? 'winner' : 'no',
                'guessed_word' => $guessedWord,
            ];
            $questions[] = $newQuestion;

            $this->testGameService->updateTestGame([
                'player' => ['points' => $newPoints],
                'questions' => $questions,
            ]);

            if ($isCorrect) {
                return response()->json([
                    'success' => true,
                    'winner' => true,
                    'question' => [
                        'id' => count($questions),
                        'question' => $question,
                        'answer' => 'winner',
                        'player' => [
                            'id' => $player['id'],
                            'name' => $player['name'],
                            'avatar_url' => $player['avatar_url'] ?? null,
                        ],
                        'created_at' => now()->toISOString(),
                    ],
                    'points_remaining' => $newPoints,
                    'game' => [
                        'secret_word' => $secretWord,
                    ],
                    'winner_data' => [
                        'id' => $player['id'],
                        'name' => $player['name'],
                        'avatar_url' => $player['avatar_url'] ?? null,
                        'points' => $newPoints,
                    ],
                    'prize_url' => config('app.prize_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
                ]);
            }

            return response()->json([
                'success' => true,
                'winner' => false,
                'question' => [
                    'id' => count($questions),
                    'question' => $question,
                    'answer' => 'no',
                    'player' => [
                        'id' => $player['id'],
                        'name' => $player['name'],
                        'avatar_url' => $player['avatar_url'] ?? null,
                    ],
                    'created_at' => now()->toISOString(),
                ],
                'points_remaining' => $newPoints,
                'wrong_guess' => true,
                'guessed_word' => $guessedWord,
            ]);
        }

        // Regular property question
        $result = $this->openRouterService->askQuestion($secretWord, $question);

        if (! $result['success']) {
            return response()->json([
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        $newPoints = $player['points'] - config('game.guess_cost');
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
