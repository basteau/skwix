<?php

use App\Http\Controllers\FortuneController;
use App\Http\Controllers\GuessController;
use App\Http\Controllers\LobbyController;
use App\Http\Controllers\PlayersController;
use App\Http\Controllers\WordleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route('welcome'));

Route::get('/welcome', function () {
    if (auth()->check()) {
        return redirect('/play/wordle');
    }

    return Inertia::render('welcome');
})->name('welcome');

Route::get('/lobby', [LobbyController::class, 'show'])->name('lobby');

Route::middleware('auth')->prefix('play')->name('play.')->group(function () {
    Route::get('wordle', [WordleController::class, 'show'])->name('wordle');
    Route::post('wordle/guess', [WordleController::class, 'guess'])->name('wordle.guess');
    Route::get('guess', [GuessController::class, 'show'])->name('guess');
    Route::post('guess/ask', [GuessController::class, 'ask'])->name('guess.ask');
    Route::get('fortune', [FortuneController::class, 'show'])->name('fortune');
    Route::post('fortune/spin', [FortuneController::class, 'spin'])->name('fortune.spin');
    Route::get('players', [PlayersController::class, 'show'])->name('players');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => Inertia::render('admin/dashboard'))->name('dashboard');
});
