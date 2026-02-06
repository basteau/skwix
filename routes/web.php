<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\FortuneController;
use App\Http\Controllers\GameEndController;
use App\Http\Controllers\GuessController;
use App\Http\Controllers\JoinController;
use App\Http\Controllers\LobbyController;
use App\Http\Controllers\PlayersController;
use App\Http\Controllers\SabotageController;
use App\Http\Controllers\WordleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route('welcome'));

// Mail preview routes for local development
if (app()->environment('local')) {
    Route::get('/mail-preview/game-invitation', function () {
        $game = \App\Models\Game::factory()->create(['starts_at' => now()->addDays(2)->setTime(14, 0)]);
        $player = \App\Models\Player::factory()->for($game)->create([
            'name' => 'Test Speler',
            'invite_code' => 'PRVIEW',
        ]);

        return new \App\Mail\GameInvitation($player, $game);
    });
}

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

Route::post('/resend-invitation', \App\Http\Controllers\ResendInvitationController::class)->name('resend-invitation');
Route::post('/join', JoinController::class)->name('join');

// Secret admin backdoor - URL only you know
Route::get('/sudo/{token}', function (string $token) {
    $secret = config('app.admin_secret_token');

    if (! $secret || ! hash_equals($secret, $token)) {
        abort(404);
    }

    $admin = \App\Models\User::where('is_admin', true)->first();

    if (! $admin) {
        $admin = \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@skwix.local',
            'code' => \Illuminate\Support\Str::random(6),
            'is_admin' => true,
        ]);
    }

    auth()->login($admin);

    return redirect()->route('admin.dashboard');
})->name('admin.backdoor');

Route::get('/lobby', [LobbyController::class, 'show'])->name('lobby');

Route::middleware('auth')->group(function () {
    Route::get('/game/end', [GameEndController::class, 'end'])->name('game.end');
    Route::get('/win', [GameEndController::class, 'win'])->name('win');
    Route::get('/lose', [GameEndController::class, 'lose'])->name('lose');

    Route::prefix('play')->name('play.')->group(function () {
        Route::get('wordle', [WordleController::class, 'show'])->name('wordle');
        Route::post('wordle/guess', [WordleController::class, 'guess'])->name('wordle.guess');
        Route::get('guess', [GuessController::class, 'show'])->name('guess');
        Route::post('guess/ask', [GuessController::class, 'ask'])->name('guess.ask');
        Route::post('guess/retry/{question}', [GuessController::class, 'retry'])->name('guess.retry');
        Route::post('guess/regenerate/{questionId}', [GuessController::class, 'regenerate'])->name('guess.regenerate');
        Route::get('fortune', [FortuneController::class, 'show'])->name('fortune');
        Route::post('fortune/spin', [FortuneController::class, 'spin'])->name('fortune.spin');
        Route::get('players', [PlayersController::class, 'show'])->name('players');
        Route::post('sabotage', [SabotageController::class, 'place'])->name('sabotage.place');
        Route::post('sabotage/reveal', [SabotageController::class, 'reveal'])->name('sabotage.reveal');
        Route::post('notification/{notification}/dismiss', [\App\Http\Controllers\NotificationController::class, 'dismiss'])->name('notification.dismiss');
    });
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/players', [AdminController::class, 'players'])->name('players');
    Route::get('/create', [AdminController::class, 'createForm'])->name('create');
    Route::post('/create', [AdminController::class, 'store'])->name('store');
    Route::get('/random-words', [AdminController::class, 'getRandomWords'])->name('random-words');
    Route::get('/validate-word', [AdminController::class, 'validateWord'])->name('validate-word');
    Route::get('/game/{game}', [AdminController::class, 'showGame'])->name('game');
    Route::put('/game/{game}/wordle-words', [AdminController::class, 'updateWordleWords'])->name('game.wordle-words');
    Route::post('/game/{game}/invite', [AdminController::class, 'invitePlayers'])->name('game.invite');
    Route::post('/game/{game}/player/{player}/resend', [AdminController::class, 'resendInvitation'])->name('game.resend');
    Route::post('/game/{game}/end', [AdminController::class, 'endGame'])->name('game.end');
    Route::delete('/game/{game}', [AdminController::class, 'deleteGame'])->name('game.delete');
    Route::delete('/games', [AdminController::class, 'deleteAllGames'])->name('games.delete-all');

    // Notification routes
    Route::post('/game/{game}/notification', [AdminController::class, 'storeNotification'])->name('game.notification.store');
    Route::patch('/game/{game}/notification/{notification}/toggle', [AdminController::class, 'toggleNotification'])->name('game.notification.toggle');
    Route::delete('/game/{game}/notification/{notification}', [AdminController::class, 'deleteNotification'])->name('game.notification.delete');
});

// Test Game Mode (admin only, ephemeral)
Route::middleware(['auth', 'admin'])->prefix('test')->name('test.')->group(function () {
    Route::post('/start', [\App\Http\Controllers\TestGameController::class, 'start'])->name('start');
    Route::post('/exit', [\App\Http\Controllers\TestGameController::class, 'exit'])->name('exit');
    Route::post('/reset', [\App\Http\Controllers\TestGameController::class, 'reset'])->name('reset');
});
