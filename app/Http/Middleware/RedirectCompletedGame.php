<?php

namespace App\Http\Middleware;

use App\Services\TestGameService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RedirectCompletedGame
{
    private array $excludedRoutes = [
        'win',
        'lose',
        'logout',
        'password.*',
        'admin.*',
        'welcome',
        'join',
    ];

    public function __construct(
        private TestGameService $testGameService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $hasActiveGame = $user->players()
            ->whereHas('game', fn ($q) => $q->whereIn('status', ['pending', 'active']))
            ->exists();

        if ($hasActiveGame) {
            return $next($request);
        }

        $completedPlayer = $user->players()
            ->whereHas('game', fn ($q) => $q->where('status', 'completed'))
            ->with(['game.winner'])
            ->latest('players.created_at')
            ->first();

        if (! $completedPlayer || ! $completedPlayer->game->winner) {
            return $next($request);
        }

        $player = $completedPlayer;

        $isWinner = (int) $player->game->winner->id === (int) $player->id;
        $route = $isWinner ? 'win' : 'lose';

        if ($request->header('X-Inertia')) {
            return Inertia::location(route($route));
        }

        return redirect()->route($route);
    }

    private function shouldSkip(Request $request): bool
    {
        if ($this->testGameService->isTestMode()) {
            return true;
        }

        if ($request->expectsJson() || $request->ajax()) {
            return true;
        }

        $routeName = $request->route()?->getName();
        if (! $routeName) {
            return true;
        }

        foreach ($this->excludedRoutes as $pattern) {
            if ($request->routeIs($pattern)) {
                return true;
            }
        }

        return false;
    }
}
