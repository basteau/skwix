<?php

namespace App\Http\Controllers;

use App\Models\GameNotification;
use App\Models\Question;
use App\Services\GameService;
use App\Services\OpenRouterService;
use App\Services\SabotageService;
use App\Services\TestGameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class GuessController extends Controller
{
    public function __construct(
        private GameService $gameService,
        private OpenRouterService $openRouterService,
        private SabotageService $sabotageService,
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

        // Get revealed sabotaged question IDs for this player
        $revealedSabotagedIds = $this->sabotageService->getRevealedSabotagedQuestionIds($player);

        // Get active notifications that the player hasn't dismissed
        $notifications = GameNotification::getActiveForPlayer($player);

        return Inertia::render('play/guess', [
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'points' => $player->points,
                'cooldown_remaining' => $player->getCooldownRemainingSeconds(),
                'cooldown_ends_at' => $player->getCooldownEndsAt()?->toISOString(),
            ],
            'game' => [
                'id' => $game->id,
                'status' => $game->status,
                'winner_id' => $game->winner_id,
                'secret_word_length' => mb_strlen($game->secret_word),
            ],
            'questions' => $questions,
            'isAdmin' => $user->is_admin,
            'revealedSabotagedIds' => $revealedSabotagedIds,
            'notifications' => $notifications,
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

        if ($player->isOnCooldown()) {
            return response()->json([
                'error' => 'cooldown_active',
                'cooldown_remaining' => $player->getCooldownRemainingSeconds(),
                'cooldown_ends_at' => $player->getCooldownEndsAt()?->toISOString(),
            ], 429);
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
        $result = $this->openRouterService->askQuestion($game->secret_word, $question, $game->word_description, $player->name);

        // If AI fails, save question with 'failed' status (no points deducted)
        if (! $result['success']) {
            $failedQuestion = Question::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'question_text' => $question,
                'answer' => 'failed',
                'wit' => null,
            ]);

            return response()->json([
                'success' => true,
                'question' => [
                    'id' => $failedQuestion->id,
                    'question' => $failedQuestion->question_text,
                    'answer' => 'failed',
                    'wit' => null,
                    'player' => [
                        'id' => $player->id,
                        'name' => $player->name,
                        'avatar_url' => $player->avatar_url,
                    ],
                    'created_at' => $failedQuestion->created_at->toISOString(),
                ],
                'points_remaining' => $player->points,
                'ai_failed' => true,
                'error_message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ]);
        }

        $answer = $result['answer'];
        $wit = $result['wit'] ?? null;

        // All questions cost points - no refunds for unknown answers
        // Check and apply sabotage only for yes/no answers
        $wasSabotaged = false;
        $savedQuestion = \DB::transaction(function () use ($game, $player, $question, $answer, $wit, &$wasSabotaged) {
            $player->decrement('points', config('game.guess_cost'));
            $player->update(['last_guess_at' => now()]);

            $questionRecord = Question::create([
                'game_id' => $game->id,
                'player_id' => $player->id,
                'question_text' => $question,
                'answer' => $answer,
                'wit' => $wit,
            ]);

            // Apply sabotage only to yes/no answers
            if (in_array($answer, ['yes', 'no'])) {
                $sabotage = $this->sabotageService->consumePendingSabotage($player, $questionRecord);
                if ($sabotage) {
                    $flippedAnswer = $this->sabotageService->flipAnswer($answer);
                    // Regenerate wit based on the flipped answer
                    $flippedWit = $this->openRouterService->generateBomaWit($flippedAnswer, $question, $player->name);
                    $questionRecord->update([
                        'answer' => $flippedAnswer,
                        'wit' => $flippedWit ?? $wit,
                    ]);
                    $wasSabotaged = true;
                }
            }

            return $questionRecord;
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
        ]);
    }

    /**
     * Retry a failed question (AI error).
     * Points are only deducted on successful retry.
     */
    public function retry(Request $request, Question $question): JsonResponse
    {
        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 403);
        }

        // Verify question belongs to player and is in failed state
        if ($question->player_id !== $player->id) {
            return response()->json(['error' => 'unauthorized'], 403);
        }

        if ($question->answer !== 'failed') {
            return response()->json(['error' => 'question_not_failed'], 400);
        }

        $game = $player->game;

        // Check if player has enough points
        if ($player->points < config('game.guess_cost')) {
            return response()->json([
                'error' => 'insufficient_points',
                'message' => 'Niet genoeg punten',
            ], 400);
        }

        // Retry the AI call
        $result = $this->openRouterService->askQuestion($game->secret_word, $question->question_text, $game->word_description, $player->name);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ]);
        }

        $answer = $result['answer'];
        $wit = $result['wit'] ?? null;

        // Success! Deduct points and update question
        $wasSabotaged = false;
        \DB::transaction(function () use ($player, $question, $answer, $wit, &$wasSabotaged) {
            $player->decrement('points', config('game.guess_cost'));

            $question->update([
                'answer' => $answer,
                'wit' => $wit,
            ]);

            // Apply sabotage only to yes/no answers
            if (in_array($answer, ['yes', 'no'])) {
                $sabotage = $this->sabotageService->consumePendingSabotage($player, $question);
                if ($sabotage) {
                    $flippedAnswer = $this->sabotageService->flipAnswer($answer);
                    $flippedWit = $this->openRouterService->generateBomaWit($flippedAnswer, $question->question_text, $player->name);
                    $question->update([
                        'answer' => $flippedAnswer,
                        'wit' => $flippedWit ?? $wit,
                    ]);
                    $wasSabotaged = true;
                }
            }
        });

        $player->refresh();
        $question->refresh();

        return response()->json([
            'success' => true,
            'question' => [
                'id' => $question->id,
                'question' => $question->question_text,
                'answer' => $question->answer,
                'wit' => $question->wit,
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'avatar_url' => $player->avatar_url,
                ],
                'created_at' => $question->created_at->toISOString(),
            ],
            'points_remaining' => $player->points,
        ]);
    }

    /**
     * Regenerate the AI answer for an already-answered question.
     * Rate limited to 1 regeneration per 5 minutes (regular) or 10 seconds (test mode).
     * Does not deduct points (already paid for the question).
     */
    public function regenerate(Request $request, int $questionId): JsonResponse
    {
        if ($this->testGameService->isTestMode()) {
            return $this->regenerateTestMode($questionId);
        }

        $question = Question::findOrFail($questionId);

        $user = $request->user();
        $player = $user->activePlayer();

        if (! $player) {
            return response()->json(['error' => 'no_active_game'], 403);
        }

        if ($question->player_id !== $player->id) {
            return response()->json(['error' => 'unauthorized'], 403);
        }

        // Only allow regeneration for answered questions (yes/no/unclear/unknown)
        $regenerableAnswers = ['yes', 'no', 'unclear', 'unknown'];
        if (! in_array($question->answer, $regenerableAnswers)) {
            return response()->json(['error' => 'not_regenerable'], 400);
        }

        $game = $player->game;

        if ($game->status !== 'active') {
            return response()->json(['error' => 'game_not_active'], 400);
        }

        // Rate limit: 1 regeneration per player per 5 minutes
        $rateLimitKey = "question-regenerate:player:{$player->id}";
        $cooldownSeconds = config('game.regenerate_cooldown_seconds', 300);

        if (RateLimiter::tooManyAttempts($rateLimitKey, 1)) {
            $retryAfter = RateLimiter::availableIn($rateLimitKey);

            return response()->json([
                'error' => 'regenerate_rate_limited',
                'retry_after' => $retryAfter,
                'message' => "Je kunt over {$retryAfter} seconden opnieuw genereren.",
            ], 429);
        }

        // Re-ask the question to the AI
        $result = $this->openRouterService->askQuestion(
            $game->secret_word,
            $question->question_text,
            $game->word_description,
            $player->name,
        );

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        $answer = $result['answer'];
        $wit = $result['wit'] ?? null;

        // Hit the rate limiter only on success
        RateLimiter::hit($rateLimitKey, $cooldownSeconds);

        // Update the question with the new answer
        $wasSabotaged = false;
        \DB::transaction(function () use ($player, $question, $answer, $wit, &$wasSabotaged) {
            $question->update([
                'answer' => $answer,
                'wit' => $wit,
            ]);

            // Re-apply sabotage if there's still a pending one
            if (in_array($answer, ['yes', 'no'])) {
                $sabotage = $this->sabotageService->consumePendingSabotage($player, $question);
                if ($sabotage) {
                    $flippedAnswer = $this->sabotageService->flipAnswer($answer);
                    $flippedWit = $this->openRouterService->generateBomaWit($flippedAnswer, $question->question_text, $player->name);
                    $question->update([
                        'answer' => $flippedAnswer,
                        'wit' => $flippedWit ?? $wit,
                    ]);
                    $wasSabotaged = true;
                }
            }
        });

        $question->refresh();

        return response()->json([
            'success' => true,
            'question' => [
                'id' => $question->id,
                'question' => $question->question_text,
                'answer' => $question->answer,
                'wit' => $question->wit,
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'avatar_url' => $player->avatar_url,
                ],
                'created_at' => $question->created_at->toISOString(),
            ],
            'retry_after' => $cooldownSeconds,
        ]);
    }

    private function handleDirectGuess($game, $player, string $question, string $guessedWord): JsonResponse
    {
        $isCorrect = $this->gameService->checkWin($game, $player, $guessedWord);
        $answerType = $isCorrect ? 'winner' : 'no';

        // Generate Boma-style wit for the guess result
        $wit = $this->openRouterService->generateBomaWit($answerType, $question, $player->name);

        // Deduct points and save the question
        $savedQuestion = \DB::transaction(function () use ($game, $player, $question, $answerType, $guessedWord, $wit) {
            $player->decrement('points', config('game.guess_cost'));
            $player->update(['last_guess_at' => now()]);

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

        // Regular property question (test mode - no description available)
        $result = $this->openRouterService->askQuestion($secretWord, $question, null, $player['name']);

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

    private function regenerateTestMode(int $questionIndex): JsonResponse
    {
        $testGame = $this->testGameService->getTestGame();
        $player = $testGame['player'];
        $questions = $testGame['questions'] ?? [];

        // Question IDs in test mode are 1-indexed
        $idx = $questionIndex - 1;
        if ($idx < 0 || $idx >= count($questions)) {
            return response()->json(['error' => 'not_found'], 404);
        }

        $existingQuestion = $questions[$idx];

        // Only allow regeneration for answered questions
        $regenerableAnswers = ['yes', 'no', 'unclear', 'unknown'];
        if (! in_array($existingQuestion['answer'], $regenerableAnswers)) {
            return response()->json(['error' => 'not_regenerable'], 400);
        }

        // Rate limit: 1 regeneration per 10 seconds in test mode
        $rateLimitKey = 'question-regenerate:test-player';
        $cooldownSeconds = config('game.regenerate_cooldown_seconds_test', 10);

        if (RateLimiter::tooManyAttempts($rateLimitKey, 1)) {
            $retryAfter = RateLimiter::availableIn($rateLimitKey);

            return response()->json([
                'error' => 'regenerate_rate_limited',
                'retry_after' => $retryAfter,
                'message' => "Je kunt over {$retryAfter} seconden opnieuw genereren.",
            ], 429);
        }

        // Re-ask the question to the AI
        $result = $this->openRouterService->askQuestion(
            $testGame['secret_word'],
            $existingQuestion['question'],
            null,
            $player['name'],
        );

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'error' => 'ai_error',
                'message' => $result['error'] ?? 'Er ging iets mis met de AI',
            ], 500);
        }

        // Hit the rate limiter only on success
        RateLimiter::hit($rateLimitKey, $cooldownSeconds);

        // Update the question in session
        $questions[$idx]['answer'] = $result['answer'];
        $questions[$idx]['wit'] = $result['wit'] ?? null;

        $this->testGameService->updateTestGame([
            'questions' => $questions,
        ]);

        return response()->json([
            'success' => true,
            'question' => [
                'id' => $questionIndex,
                'question' => $existingQuestion['question'],
                'answer' => $result['answer'],
                'wit' => $result['wit'] ?? null,
                'player' => [
                    'id' => $player['id'],
                    'name' => $player['name'],
                    'avatar_url' => $player['avatar_url'] ?? null,
                ],
                'created_at' => now()->toISOString(),
            ],
            'retry_after' => $cooldownSeconds,
        ]);
    }
}
