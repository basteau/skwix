<?php

namespace App\Http\Controllers;

use App\Mail\GameInvitation;
use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use App\Services\WordlistService;
use Carbon\Carbon;
use Database\Seeders\DutchWordlistSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(
        private WordlistService $wordlistService
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

    public function createForm(): Response
    {
        $sampleWords = DutchWordlistSeeder::getRandomWords(20);

        return Inertia::render('admin/create-game', [
            'sampleWords' => $sampleWords,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'secret_word' => 'required|string|min:2|max:50',
            'starts_at' => 'required|date|after:now',
            'duration_days' => 'required|integer|min:4|max:6',
            'wordle_words' => 'required|array|min:4|max:6',
            'wordle_words.*' => 'string|size:5',
            'players' => 'required|array|min:2|max:8',
            'players.*.name' => 'required|string|max:100',
            'players.*.email' => 'required|email|max:255',
            'players.*.avatar' => 'nullable|string|max:100',
        ]);

        $emails = array_map(fn ($p) => strtolower($p['email']), $request->players);
        if (count($emails) !== count(array_unique($emails))) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['players' => 'Elke speler moet een uniek e-mailadres hebben']);
        }

        $invalidWords = $this->validateWordleWordsAgainstWordlist($request->wordle_words);
        if (! empty($invalidWords)) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['wordle_words' => 'Onbekende woorden: '.implode(', ', $invalidWords)]);
        }

        $game = \DB::transaction(function () use ($request) {
            $startsAt = Carbon::parse($request->starts_at);
            $endsAt = $startsAt->copy()->addDays($request->duration_days);

            $game = Game::create([
                'secret_word' => strtolower(trim($request->secret_word)),
                'status' => 'draft',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'wordle_words' => array_map('strtolower', $request->wordle_words),
            ]);

            foreach ($request->players as $playerData) {
                $inviteCode = strtoupper(Str::random(6));

                $avatar = $playerData['avatar'] ?? null;
                $avatarUrl = $avatar ? "/images/faces/{$avatar}.png" : null;

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
                    'avatar_url' => $avatarUrl,
                    'points' => 0,
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
        $words = DutchWordlistSeeder::getRandomWords($count);

        return response()->json(['words' => $words]);
    }

    public function showGame(Game $game): Response
    {
        $game->load(['players', 'winner', 'wordleAttempts', 'spinResults', 'questions']);

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

        return Inertia::render('admin/game', [
            'game' => [
                'id' => $game->id,
                'secret_word' => $game->secret_word,
                'status' => $game->status,
                'starts_at' => $game->starts_at?->toISOString(),
                'ends_at' => $game->ends_at?->toISOString(),
                'wordle_words' => $game->wordle_words ?? [],
                'winner' => $game->winner ? [
                    'id' => $game->winner->id,
                    'name' => $game->winner->name,
                ] : null,
            ],
            'players' => $players,
        ]);
    }

    public function updateWordleWords(Request $request, Game $game): RedirectResponse
    {
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

        return redirect()
            ->route('admin.game', $game)
            ->with('success', 'Spel beëindigd');
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
}
