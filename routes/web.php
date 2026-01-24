<?php

use App\Http\Controllers\InviteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome'))->name('home');

// API routes for game
Route::post('/api/validate-invite', [InviteController::class, 'validate']);

// Lobby route
Route::get('/lobby', fn () => Inertia::render('lobby'))->name('lobby');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// Game play routes (no auth for now - tracer bullet)
Route::prefix('play')->name('play.')->group(function () {
    Route::get('wordle', fn () => Inertia::render('play/wordle'))->name('wordle');
    Route::get('guess', fn () => Inertia::render('play/guess'))->name('guess');
    Route::get('fortune', fn () => Inertia::render('play/fortune'))->name('fortune');
    Route::get('players', fn () => Inertia::render('play/players'))->name('players');
});

require __DIR__.'/settings.php';
