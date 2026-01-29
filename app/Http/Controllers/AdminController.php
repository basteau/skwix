<?php

namespace App\Http\Controllers;

use App\Mail\GameInvitation;
use App\Models\Game;
use App\Models\GameNotification;
use App\Models\Player;
use App\Models\User;
use App\Services\GameEndedNotificationService;
use App\Services\WordlistService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(
        private WordlistService $wordlistService,
        private GameEndedNotificationService $notificationService,
    ) {}

    public function dashboard(): Response
    {
        $games = Game::with('players')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($game) => [
                'id' => $game->id,
                'secret_word' => $game->secret_word,
                'status' => $game->status,
                'player_count' => $game->players->count(),
                'starts_at' => $game->starts_at?->toISOString(),
                'created_at' => $game->created_at->toISOString(),
            ]);

        return Inertia::render('admin/dashboard', [
            'games' => $games,
        ]);
    }

    public function players(): Response
    {
        $players = Player::with('game')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($player) => [
                'id' => $player->id,
                'name' => $player->name,
                'email' => $player->email,
                'avatar_url' => $player->avatar_url,
                'points' => $player->points,
                'invite_code' => $player->invite_code,
                'joined_at' => $player->joined_at?->toISOString(),
                'game_id' => $player->game_id,
                'game_secret_word' => $player->game->secret_word,
                'game_status' => $player->game->status,
            ]);

        return Inertia::render('admin/players', [
            'players' => $players,
        ]);
    }

    public function createForm(): Response
    {
        $availableUsers = User::orderBy('name')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar,
            ]);

        return Inertia::render('admin/create-game', [
            'availableUsers' => $availableUsers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'secret_word' => 'required|string|min:2|max:50',
            'word_description' => 'nullable|string|max:500',
            'starts_at' => 'required|date|after:now',
            'wordle_hour' => 'required|integer|min:0|max:23',
            'cooldown_hours' => 'nullable|integer|in:4,6,8,12,24',
            'wordle_interval_hours' => 'nullable|integer|in:8,12,24',
            'starting_points' => 'nullable|integer|min:0|max:10000',
            'players' => 'required|array|min:2|max:8',
            'players.*.name' => 'required|string|max:100',
            'players.*.email' => 'required|email|max:255',
        ]);

        $emails = array_map(fn ($p) => strtolower($p['email']), $request->players);
        if (count($emails) !== count(array_unique($emails))) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['players' => 'Elke speler moet een uniek e-mailadres hebben']);
        }

        $game = \DB::transaction(function () use ($request) {
            $startsAt = Carbon::parse($request->starts_at)->setTimezone('Europe/Brussels');
            $startingPoints = (int) ($request->starting_points ?? 0);

            $game = Game::create([
                'secret_word' => strtolower(trim($request->secret_word)),
                'word_description' => $request->word_description ? trim($request->word_description) : null,
                'status' => 'draft',
                'starts_at' => $startsAt,
                'ends_at' => null,
                'wordle_words' => $this->wordlistService->getRandomWords(60),
                'wordle_hour' => (int) $request->wordle_hour,
                'cooldown_hours' => (int) ($request->cooldown_hours ?? 8),
                'wordle_interval_hours' => (int) ($request->wordle_interval_hours ?? 24),
                'starting_points' => $startingPoints,
            ]);

            foreach ($request->players as $playerData) {
                $inviteCode = strtoupper(Str::random(6));

                $avatar = $this->getAvatarForName($playerData['name']);

                $user = User::firstOrCreate(
                    ['email' => $playerData['email']],
                    [
                        'name' => $playerData['name'],
                        'code' => $inviteCode,
                        'avatar' => $avatar,
                    ]
                );

                if ($user->wasRecentlyCreated === false) {
                    $user->update(['code' => $inviteCode]);
                }

                Player::create([
                    'game_id' => $game->id,
                    'name' => $playerData['name'],
                    'email' => $playerData['email'],
                    'avatar_url' => $avatar,
                    'points' => $startingPoints,
                    'invite_code' => $inviteCode,
                ]);
            }

            return $game;
        });

        return redirect()
            ->route('admin.dashboard')
            ->with('success', 'Spel aangemaakt met '.$game->players()->count().' spelers.');
    }

    public function getRandomWords(Request $request)
    {
        $count = min(max((int) $request->get('count', 6), 1), 10);
        $words = $this->wordlistService->getRandomWords($count);

        return response()->json(['words' => $words]);
    }

    public function validateWord(Request $request)
    {
        $word = strtolower(trim($request->get('word', '')));

        if (strlen($word) !== 5) {
            return response()->json([
                'valid' => false,
                'message' => 'Woord moet 5 letters zijn',
                'suggestions' => [],
            ]);
        }

        $isValid = $this->wordlistService->isValidWord($word);

        $suggestions = [];
        if (! $isValid) {
            $suggestions = $this->getSimilarWords($word);
        }

        return response()->json([
            'valid' => $isValid,
            'message' => $isValid ? 'Geldig woord' : 'Onbekend woord',
            'suggestions' => $suggestions,
        ]);
    }

    private function getSimilarWords(string $word): array
    {
        $allWords = $this->wordlistService->getWords();

        return $allWords
            ->filter(fn ($w) => similar_text($word, $w) >= 3 || levenshtein($word, $w) <= 2)
            ->take(5)
            ->values()
            ->all();
    }

    public function showGame(Game $game): Response
    {
        $game->load(['players', 'winner', 'wordleAttempts', 'spinResults', 'questions', 'notifications']);

        $players = $game->players
            ->sortByDesc('points')
            ->values()
            ->map(fn ($player) => [
                'id' => $player->id,
                'name' => $player->name,
                'email' => $player->email,
                'avatar_url' => $player->avatar_url,
                'points' => $player->points,
                'invite_code' => $player->invite_code,
                'joined_at' => $player->joined_at?->toISOString(),
                'wordle_completed' => $game->wordleAttempts->where('player_id', $player->id)->where('completed', true)->count(),
                'questions_asked' => $game->questions->where('player_id', $player->id)->count(),
                'spins_count' => $game->spinResults->where('player_id', $player->id)->count(),
            ]);

        $notifications = $game->notifications
            ->sortByDesc('created_at')
            ->values()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'message' => $notification->message,
                'is_active' => $notification->is_active,
                'created_at' => $notification->created_at->toISOString(),
            ]);

        return Inertia::render('admin/game', [
            'game' => [
                'id' => $game->id,
                'secret_word' => $game->secret_word,
                'status' => $game->status,
                'starts_at' => $game->starts_at?->toISOString(),
                'ends_at' => $game->ends_at?->toISOString(),
                'wordle_words' => $game->wordle_words ?? [],
                'wordle_hour' => $game->wordle_hour ?? 8,
                'cooldown_hours' => $game->cooldown_hours ?? 8,
                'wordle_interval_hours' => $game->wordle_interval_hours ?? 24,
                'winner' => $game->winner ? [
                    'id' => $game->winner->id,
                    'name' => $game->winner->name,
                ] : null,
            ],
            'players' => $players,
            'notifications' => $notifications,
        ]);
    }

    public function updateWordleWords(Request $request, Game $game): RedirectResponse
    {
        if ($game->status !== 'draft') {
            return redirect()
                ->route('admin.game', $game)
                ->with('error', 'Wordle woorden kunnen niet meer worden aangepast nadat uitnodigingen zijn verstuurd');
        }

        $request->validate([
            'wordle_words' => 'required|array|min:4|max:6',
            'wordle_words.*' => 'string|size:5',
        ]);

        $invalidWords = $this->validateWordleWordsAgainstWordlist($request->wordle_words);
        if (! empty($invalidWords)) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['wordle_words' => 'Onbekende woorden: '.implode(', ', $invalidWords)]);
        }

        $game->update([
            'wordle_words' => array_map('strtolower', $request->wordle_words),
        ]);

        return redirect()
            ->route('admin.game', $game)
            ->with('success', 'Wordle woorden bijgewerkt');
    }

    public function updateGameSettings(Request $request, Game $game): RedirectResponse
    {
        if ($game->status === 'completed') {
            return redirect()
                ->route('admin.game', $game)
                ->with('error', 'Instellingen kunnen niet worden aangepast voor voltooide spellen');
        }

        $request->validate([
            'cooldown_hours' => 'required|integer|in:4,6,8,12,24',
            'wordle_interval_hours' => 'required|integer|in:8,12,24',
        ]);

        $oldCooldownHours = $game->cooldown_hours;
        $newCooldownHours = (int) $request->cooldown_hours;
        $oldWordleInterval = $game->wordle_interval_hours;
        $newWordleInterval = (int) $request->wordle_interval_hours;

        // Update game settings
        $game->update([
            'cooldown_hours' => $newCooldownHours,
            'wordle_interval_hours' => $newWordleInterval,
        ]);

        // Apply cooldown changes to players with immediate effect
        // Rule: if new cooldown is SHORTER, reduce remaining cooldown time
        // Rule: if new cooldown is LONGER, keep original end time (don't extend)
        if ($newCooldownHours < $oldCooldownHours) {
            $this->reducePlayerCooldowns($game, $newCooldownHours);
        }

        // Apply wordle interval changes with immediate effect
        // Rule: if new interval is SHORTER, reduce time until next wordle
        // Rule: if new interval is LONGER, keep original next_wordle_at (don't skip words)
        if ($newWordleInterval !== $oldWordleInterval) {
            $this->updateNextWordleTime($game, $newWordleInterval);
        }

        return redirect()
            ->route('admin.game', $game)
            ->with('success', 'Spelinstellingen bijgewerkt');
    }

    /**
     * Reduce cooldown_ends_at for all players who would benefit from shorter cooldown.
     * Only affects players currently on cooldown whose remaining time exceeds new cooldown.
     */
    private function reducePlayerCooldowns(Game $game, int $newHours): void
    {
        // Get all players currently on cooldown
        $game->players()
            ->whereNotNull('cooldown_ends_at')
            ->where('cooldown_ends_at', '>', now())
            ->get()
            ->each(function (Player $player) use ($newHours) {
                // Calculate what the new cooldown_ends_at would be
                $newCooldownEndsAt = $player->last_guess_at
                    ? $player->last_guess_at->copy()->addHours($newHours)
                    : null;

                // Only reduce if the new end time is earlier than current
                if ($newCooldownEndsAt && $newCooldownEndsAt->lt($player->cooldown_ends_at)) {
                    $player->update(['cooldown_ends_at' => $newCooldownEndsAt]);
                }
            });
    }

    /**
     * Update next_wordle_at when interval changes.
     * Only reduces time, never extends (to prevent skipping words).
     * For existing games without next_wordle_at, initializes it.
     */
    private function updateNextWordleTime(Game $game, int $newInterval): void
    {
        $gameService = app(\App\Services\GameService::class);
        $lastUnlock = $gameService->getLastWordleUnlockTime($game);
        $newNextWordle = $lastUnlock->copy()->addHours($newInterval);

        // If next_wordle_at is not set (existing game before migration), initialize it
        if (! $game->next_wordle_at) {
            $game->update(['next_wordle_at' => $newNextWordle]);

            return;
        }

        // Only reduce if new time is earlier (never extend to prevent skipping words)
        if ($newNextWordle->lt($game->next_wordle_at)) {
            $game->update(['next_wordle_at' => $newNextWordle]);
        }
    }

    public function endGame(Request $request, Game $game): RedirectResponse
    {
        if ($game->status === 'completed') {
            return redirect()
                ->route('admin.game', $game)
                ->with('error', 'Spel is al beëindigd');
        }

        $request->validate([
            'winner_id' => 'nullable|exists:players,id',
        ]);

        $game->update([
            'status' => 'completed',
            'winner_id' => $request->winner_id,
            'ends_at' => Carbon::now(),
        ]);

        $this->notificationService->notifyAllPlayers($game);

        return redirect()
            ->route('admin.game', $game)
            ->with('success', 'Spel beëindigd, spelers zijn per email geïnformeerd');
    }

    public function invitePlayers(Game $game): RedirectResponse
    {
        if ($game->status !== 'draft') {
            return redirect()
                ->route('admin.game', $game)
                ->with('error', 'Uitnodigingen zijn al verstuurd');
        }

        $game->load('players');

        foreach ($game->players as $player) {
            Mail::to($player->email)->queue(new GameInvitation($player, $game));
        }

        $game->update(['status' => 'pending']);

        return redirect()
            ->route('admin.game', $game)
            ->with('success', $game->players->count().' uitnodigingen verstuurd');
    }

    public function resendInvitation(Game $game, Player $player): RedirectResponse
    {
        if ($player->game_id !== $game->id) {
            return redirect()
                ->route('admin.game', $game)
                ->with('error', 'Speler hoort niet bij dit spel');
        }

        if ($game->status === 'completed') {
            return redirect()
                ->route('admin.game', $game)
                ->with('error', 'Spel is al beëindigd');
        }

        Mail::to($player->email)->queue(new GameInvitation($player, $game));

        return redirect()
            ->route('admin.game', $game)
            ->with('success', 'Uitnodiging verstuurd naar '.$player->name);
    }

    public function deleteGame(Game $game): RedirectResponse
    {
        if ($game->status !== 'completed') {
            return redirect()
                ->route('admin.dashboard')
                ->with('error', 'Alleen voltooide spellen kunnen verwijderd worden');
        }

        $game->delete();

        return redirect()
            ->route('admin.dashboard')
            ->with('success', 'Spel verwijderd');
    }

    public function deleteAllGames(): RedirectResponse
    {
        $count = Game::where('status', 'completed')->count();

        if ($count === 0) {
            return redirect()
                ->route('admin.dashboard')
                ->with('error', 'Geen voltooide spellen om te verwijderen');
        }

        Game::where('status', 'completed')->delete();

        return redirect()
            ->route('admin.dashboard')
            ->with('success', "{$count} voltooide spellen verwijderd");
    }

    private function validateWordleWordsAgainstWordlist(array $words): array
    {
        $invalidWords = [];
        foreach ($words as $word) {
            if (! $this->wordlistService->isValidWord($word)) {
                $invalidWords[] = $word;
            }
        }

        return $invalidWords;
    }

    private function getAvatarForName(string $name): ?string
    {
        $availableAvatars = [
            'player09',
            'player07',
            'player06',
            'jane',
            'player08',
            'john',
            'player05',
            'player04',
            'player01',
            'player02',
            'player03',
        ];

        $normalized = strtolower(trim($name));

        return in_array($normalized, $availableAvatars, true) ? $normalized : null;
    }

    public function storeNotification(Request $request, Game $game): JsonResponse
    {
        if ($game->status === 'completed') {
            return response()->json([
                'error' => 'game_completed',
                'message' => 'Spel is al beëindigd',
            ], 400);
        }

        $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $notification = GameNotification::create([
            'game_id' => $game->id,
            'message' => trim($request->message),
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'notification' => [
                'id' => $notification->id,
                'message' => $notification->message,
                'is_active' => $notification->is_active,
                'created_at' => $notification->created_at->toISOString(),
            ],
        ]);
    }

    public function toggleNotification(Game $game, GameNotification $notification): JsonResponse
    {
        if ($notification->game_id !== $game->id) {
            return response()->json([
                'error' => 'invalid_notification',
                'message' => 'Notificatie hoort niet bij dit spel',
            ], 400);
        }

        $notification->update([
            'is_active' => ! $notification->is_active,
        ]);

        return response()->json([
            'success' => true,
            'is_active' => $notification->is_active,
        ]);
    }

    public function deleteNotification(Game $game, GameNotification $notification): JsonResponse
    {
        if ($notification->game_id !== $game->id) {
            return response()->json([
                'error' => 'invalid_notification',
                'message' => 'Notificatie hoort niet bij dit spel',
            ], 400);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
        ]);
    }
}
