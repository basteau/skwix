<?php

use App\Models\User;
use App\Services\TestGameService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('TestGameController start', function () {
    it('starts test game and redirects to wordle', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->post('/test/start');

        $response->assertRedirect(route('play.wordle'));

        $testGameService = app(TestGameService::class);
        expect($testGameService->isTestMode())->toBeTrue();
    });

    it('initializes test game with player and points', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->post('/test/start');

        $testGameService = app(TestGameService::class);
        $testGame = $testGameService->getTestGame();

        expect($testGame)->not->toBeNull();
        expect($testGame['player']['name'])->toBe('Test Speler');
        expect($testGame['player']['points'])->toBe(100);
        expect($testGame['status'])->toBe('active');
    });

    it('generates wordle words for test game', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->post('/test/start');

        $testGameService = app(TestGameService::class);
        $testGame = $testGameService->getTestGame();

        expect($testGame['wordle_words'])->toHaveCount(5);
    });

    it('generates fake players for leaderboard', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->post('/test/start');

        $testGameService = app(TestGameService::class);
        $testGame = $testGameService->getTestGame();

        expect($testGame['fake_players'])->toHaveCount(4);
    });
});

describe('TestGameController exit', function () {
    it('exits test mode and redirects to admin', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        expect($testGameService->isTestMode())->toBeTrue();

        $response = $this->actingAs($admin)->post('/test/exit');

        $response->assertRedirect(route('admin.dashboard'));
        expect($testGameService->isTestMode())->toBeFalse();
    });
});

describe('TestGameController reset', function () {
    it('resets test game and redirects to wordle', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $testGameService->updateTestGame(['player' => ['points' => 25]]);
        expect($testGameService->getTestGame()['player']['points'])->toBe(25);

        $response = $this->actingAs($admin)->post('/test/reset');

        $response->assertRedirect(route('play.wordle'));
        expect($testGameService->getTestGame()['player']['points'])->toBe(100);
    });
});

describe('Test mode integration with FortuneController', function () {
    it('shows fortune page in test mode', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $response = $this->actingAs($admin)->get('/play/fortune');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/fortune')
            ->has('testMode')
            ->where('testMode.active', true)
            ->where('player.name', 'Test Speler')
            ->where('player.points', 100)
        );
    });

    it('allows spinning in test mode', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $response = $this->actingAs($admin)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'won',
            'points_change',
            'points_remaining',
            'spin_result',
        ]);
    });

    it('persists spins in test mode session', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $this->actingAs($admin)->postJson('/play/fortune/spin', ['wager' => 5]);
        $this->actingAs($admin)->postJson('/play/fortune/spin', ['wager' => 10]);

        $testGame = $testGameService->getTestGame();
        expect($testGame['spins'])->toHaveCount(2);
    });

    it('limits spin history to 5 items in test mode', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        for ($i = 0; $i < 7; $i++) {
            $this->actingAs($admin)->postJson('/play/fortune/spin', ['wager' => 5]);
        }

        $testGame = $testGameService->getTestGame();
        expect($testGame['spins'])->toHaveCount(5);
    });

    it('rejects spin with insufficient points in test mode', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();
        $testGameService->updateTestGame(['player' => ['points' => 5]]);

        $response = $this->actingAs($admin)->postJson('/play/fortune/spin', [
            'wager' => 10,
        ]);

        $response->assertStatus(400);
        $response->assertJson(['error' => 'insufficient_points']);
    });
});

describe('Test mode integration with PlayersController', function () {
    it('shows players page in test mode with fake players', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $response = $this->actingAs($admin)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('play/players')
            ->has('testMode')
            ->where('testMode.active', true)
            ->has('players', 5) // 1 test player + 4 fake players
        );
    });

    it('marks test player as current player', function () {
        $admin = User::factory()->create(['is_admin' => true]);

        $testGameService = app(TestGameService::class);
        $testGameService->startTestGame();

        $response = $this->actingAs($admin)->get('/play/players');

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $players = $page->toArray()['props']['players'];
            $currentPlayer = collect($players)->firstWhere('is_current', true);

            expect($currentPlayer)->not->toBeNull();
            expect($currentPlayer['name'])->toBe('Test Speler');

            return $page;
        });
    });
});
