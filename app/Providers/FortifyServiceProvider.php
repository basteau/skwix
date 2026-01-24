<?php

namespace App\Providers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest as FortifyLoginRequest;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(FortifyLoginRequest::class, LoginRequest::class);
    }

    public function boot(): void
    {
        $this->configureAuthentication();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $code = strtoupper(trim((string) $request->input('code')));

            if ($code === '') {
                return null;
            }

            $user = User::query()
                ->whereRaw('UPPER(code) = ?', [$code])
                ->first();

            if ($user) {
                // Set player_id in session if user has an active player
                $activePlayer = $user->activePlayer();
                if ($activePlayer) {
                    session(['player_id' => $activePlayer->id]);
                    
                    // Mark player as joined if not already
                    if (! $activePlayer->joined_at) {
                        $activePlayer->update(['joined_at' => now()]);
                    }
                }
            }

            return $user;
        });
    }

    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('welcome', [
            'status' => $request->session()->get('status'),
        ]));
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::lower($request->input('code') ?? '').'|'.$request->ip();

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
