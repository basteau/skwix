<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\FortuneController;
use App\Http\Controllers\GameEndController;
use App\Http\Controllers\GuessController;
use App\Http\Controllers\LobbyController;
use App\Http\Controllers\PlayersController;
use App\Http\Controllers\WordleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route('welcome'));

// Debug endpoint for E2E testing
if (app()->environment('e2e')) {
    Route::get('/debug-env', function () {
        $encrypter = app('encrypter');
        $key = $encrypter->getKey();
        $cookiePrefix = hash_hmac('sha1', 'skwix-session', $key);

        // Get all session data
        $sessionData = session()->all();
        $authKey = 'login_web_'.sha1('Illuminate\Auth\SessionGuard');

        return response()->json([
            'env' => app()->environment(),
            'key_prefix' => substr(config('app.key'), 0, 20).'...',
            'cookie_prefix' => $cookiePrefix,
            'session_driver' => config('session.driver'),
            'session_id' => session()->getId(),
            'session_has_auth_key' => session()->has($authKey),
            'session_keys' => array_keys($sessionData),
            'auth_check' => auth()->check(),
            'auth_id' => auth()->id(),
        ]);
    });
}

Route::get('/welcome', function () {
    if (auth()->check()) {
        return redirect('/play/wordle');
    }

    return Inertia::render('welcome');
})->name('welcome');

Route::get('/lobby', [LobbyController::class, 'show'])->name('lobby');

Route::middleware('auth')->group(function () {
    Route::get('/win', [GameEndController::class, 'win'])->name('win');
    Route::get('/lose', [GameEndController::class, 'lose'])->name('lose');

    Route::prefix('play')->name('play.')->group(function () {
        Route::get('wordle', [WordleController::class, 'show'])->name('wordle');
        Route::post('wordle/guess', [WordleController::class, 'guess'])->name('wordle.guess');
        Route::get('guess', [GuessController::class, 'show'])->name('guess');
        Route::post('guess/ask', [GuessController::class, 'ask'])->name('guess.ask');
        Route::get('fortune', [FortuneController::class, 'show'])->name('fortune');
        Route::post('fortune/spin', [FortuneController::class, 'spin'])->name('fortune.spin');
        Route::get('players', [PlayersController::class, 'show'])->name('players');
    });
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/create', [AdminController::class, 'createForm'])->name('create');
    Route::post('/create', [AdminController::class, 'store'])->name('store');
    Route::get('/random-words', [AdminController::class, 'getRandomWords'])->name('random-words');
    Route::get('/game/{game}', [AdminController::class, 'showGame'])->name('game');
    Route::put('/game/{game}/wordle-words', [AdminController::class, 'updateWordleWords'])->name('game.wordle-words');
    Route::post('/game/{game}/end', [AdminController::class, 'endGame'])->name('game.end');
});
