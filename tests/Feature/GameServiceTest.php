<?php

use App\Models\Game;
use App\Models\Player;
use App\Services\GameService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->gameService = new GameService;
});

describe('getDayNumber', function () {
    it('returns 1 on the first day of the game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'status' => 'active',
        ]);

        expect($this->gameService->getDayNumber($game))->toBe(1);
    });

    it('returns 3 on the third day of the game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 26, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'status' => 'active',
        ]);

        expect($this->gameService->getDayNumber($game))->toBe(3);
    });

    it('stays on day 1 before 8am on day 2', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 7, 59, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'status' => 'active',
        ]);

        expect($this->gameService->getDayNumber($game))->toBe(1);
    });

    it('moves to day 2 at exactly 8am', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 8, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'status' => 'active',
        ]);

        expect($this->gameService->getDayNumber($game))->toBe(2);
    });

    it('starts day 1 at next 8am if game created after 8am', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 25, 10, 0, 0, 'Europe/Brussels'),
            'status' => 'active',
        ]);

        expect($this->gameService->getDayNumber($game))->toBe(1);
    });

    it('returns 1 if game starts before 8am on same day', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 6, 0, 0, 'Europe/Brussels'),
            'status' => 'active',
        ]);

        expect($this->gameService->getDayNumber($game))->toBe(1);
    });
});

describe('isWordleAvailable', function () {
    it('returns false before 8:00 AM Brussels time', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 7, 59, 0, 'Europe/Brussels'));

        $game = Game::factory()->create(['status' => 'active']);

        expect($this->gameService->isWordleAvailable($game))->toBeFalse();
    });

    it('returns true after 8:00 AM Brussels time for active game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 8, 1, 0, 'Europe/Brussels'));

        $game = Game::factory()->create(['status' => 'active']);

        expect($this->gameService->isWordleAvailable($game))->toBeTrue();
    });

    it('returns false for non-active game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create(['status' => 'pending']);

        expect($this->gameService->isWordleAvailable($game))->toBeFalse();
    });
});

describe('getCurrentWordleWord', function () {
    it('returns the correct word for the current day', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'wordle_words' => ['woord', 'appel', 'tafel'],
        ]);

        expect($this->gameService->getCurrentWordleWord($game))->toBe('woord');
    });

    it('returns second word on day 2', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'wordle_words' => ['woord', 'appel', 'tafel'],
        ]);

        expect($this->gameService->getCurrentWordleWord($game))->toBe('appel');
    });
});

describe('checkWin', function () {
    it('returns true when guess matches secret word', function () {
        $game = Game::factory()->create(['secret_word' => 'winter']);
        $player = Player::factory()->create(['game_id' => $game->id]);

        expect($this->gameService->checkWin($game, $player, 'winter'))->toBeTrue();
    });

    it('returns true case-insensitive', function () {
        $game = Game::factory()->create(['secret_word' => 'Winter']);
        $player = Player::factory()->create(['game_id' => $game->id]);

        expect($this->gameService->checkWin($game, $player, 'WINTER'))->toBeTrue();
    });

    it('returns false when guess does not match', function () {
        $game = Game::factory()->create(['secret_word' => 'winter']);
        $player = Player::factory()->create(['game_id' => $game->id]);

        expect($this->gameService->checkWin($game, $player, 'zomer'))->toBeFalse();
    });
});

describe('setWinner', function () {
    it('sets winner and completes game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 12, 0, 0));

        $game = Game::factory()->create(['status' => 'active']);
        $player = Player::factory()->create(['game_id' => $game->id]);

        $this->gameService->setWinner($game, $player);

        $game->refresh();
        expect($game->winner_id)->toBe($player->id);
        expect($game->status)->toBe('completed');
        expect($game->ends_at)->not->toBeNull();
    });
});

describe('activateGame', function () {
    it('activates pending game when start time has passed', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0));

        $game = Game::factory()->create([
            'status' => 'pending',
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0),
        ]);

        $this->gameService->activateGame($game);

        $game->refresh();
        expect($game->status)->toBe('active');
    });

    it('does not activate game before start time', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 7, 0, 0));

        $game = Game::factory()->create([
            'status' => 'pending',
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0),
        ]);

        $this->gameService->activateGame($game);

        $game->refresh();
        expect($game->status)->toBe('pending');
    });
});
