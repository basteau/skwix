<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DutchWordlistSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
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
            'players.*.avatar_url' => 'nullable|url|max:500',
        ]);

        $game = \DB::transaction(function () use ($request) {
            $startsAt = Carbon::parse($request->starts_at);
            $endsAt = $startsAt->copy()->addDays($request->duration_days);

            $game = Game::create([
                'secret_word' => strtolower(trim($request->secret_word)),
                'status' => 'pending',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'wordle_words' => $request->wordle_words,
            ]);

            foreach ($request->players as $playerData) {
                $inviteCode = strtoupper(Str::random(6));

                $user = User::firstOrCreate(
                    ['email' => $playerData['email']],
                    [
                        'name' => $playerData['name'],
                        'code' => $inviteCode,
                        'avatar' => $playerData['avatar_url'] ?? null,
                    ]
                );

                if ($user->wasRecentlyCreated === false) {
                    $user->update(['code' => $inviteCode]);
                }

                Player::create([
                    'game_id' => $game->id,
                    'name' => $playerData['name'],
                    'email' => $playerData['email'],
                    'avatar_url' => $playerData['avatar_url'] ?? null,
                    'points' => 0,
                    'invite_code' => $inviteCode,
                ]);
            }

            return $game;
        });

        return redirect()
            ->route('admin.dashboard')
            ->with('success', 'Spel aangemaakt met '.$game->players()->count().' spelers');
    }

    public function getRandomWords(Request $request)
    {
        $count = min(max((int) $request->get('count', 6), 1), 10);
        $words = DutchWordlistSeeder::getRandomWords($count);

        return response()->json(['words' => $words]);
    }
}
