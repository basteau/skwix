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

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::create(2026, 1, 23, 10, 0, 0, 'Europe/Brussels'),
        ]);

        expect($this->gameService->isWordleAvailable($game))->toBeFalse();
    });

    it('returns true after 8:00 AM Brussels time for active game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 8, 1, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::create(2026, 1, 23, 10, 0, 0, 'Europe/Brussels'),
        ]);

        expect($this->gameService->isWordleAvailable($game))->toBeTrue();
    });

    it('returns false for non-active game', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create(['status' => 'pending']);

        expect($this->gameService->isWordleAvailable($game))->toBeFalse();
    });

    it('returns false before first unlock when game started after wordle hour', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::create(2026, 1, 24, 9, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        expect($this->gameService->isWordleAvailable($game))->toBeFalse();
    });

    it('returns true at first unlock when game started after wordle hour', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 8, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::create(2026, 1, 24, 9, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        expect($this->gameService->isWordleAvailable($game))->toBeTrue();
    });

    it('returns true at first unlock when game started before wordle hour', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::create(2026, 1, 24, 6, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        expect($this->gameService->isWordleAvailable($game))->toBeTrue();
    });

    it('returns false just before first unlock when game started before wordle hour', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 7, 59, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'status' => 'active',
            'starts_at' => Carbon::create(2026, 1, 24, 6, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        expect($this->gameService->isWordleAvailable($game))->toBeFalse();
    });
});

describe('getFirstWordleUnlockTime', function () {
    it('returns same day unlock when game starts before wordle hour', function () {
        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 6, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        $firstUnlock = $this->gameService->getFirstWordleUnlockTime($game);

        expect($firstUnlock->format('Y-m-d H:i'))->toBe('2026-01-24 08:00');
    });

    it('returns next day unlock when game starts after wordle hour', function () {
        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        $firstUnlock = $this->gameService->getFirstWordleUnlockTime($game);

        expect($firstUnlock->format('Y-m-d H:i'))->toBe('2026-01-25 08:00');
    });

    it('returns same day unlock when game starts exactly at wordle hour', function () {
        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 8, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        $firstUnlock = $this->gameService->getFirstWordleUnlockTime($game);

        expect($firstUnlock->format('Y-m-d H:i'))->toBe('2026-01-24 08:00');
    });

    it('works with custom wordle hour', function () {
        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 14,
        ]);

        $firstUnlock = $this->gameService->getFirstWordleUnlockTime($game);

        expect($firstUnlock->format('Y-m-d H:i'))->toBe('2026-01-24 14:00');
    });

    it('handles midnight wordle hour correctly', function () {
        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 1, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 0,
        ]);

        $firstUnlock = $this->gameService->getFirstWordleUnlockTime($game);

        expect($firstUnlock->format('Y-m-d H:i'))->toBe('2026-01-25 00:00');
    });

    it('handles 23:00 wordle hour correctly', function () {
        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 22, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 23,
        ]);

        $firstUnlock = $this->gameService->getFirstWordleUnlockTime($game);

        expect($firstUnlock->format('Y-m-d H:i'))->toBe('2026-01-24 23:00');
    });
});

describe('getNextWordleUnlockTime', function () {
    it('returns first unlock time when before first unlock', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 24, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 9, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        $nextUnlock = $this->gameService->getNextWordleUnlockTime($game);

        expect($nextUnlock->format('Y-m-d H:i'))->toBe('2026-01-25 08:00');
    });

    it('returns today unlock when before wordle hour but after first unlock', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 7, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 6, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        $nextUnlock = $this->gameService->getNextWordleUnlockTime($game);

        expect($nextUnlock->format('Y-m-d H:i'))->toBe('2026-01-25 08:00');
    });

    it('returns tomorrow unlock when after wordle hour', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 25, 10, 0, 0, 'Europe/Brussels'));

        $game = Game::factory()->create([
            'starts_at' => Carbon::create(2026, 1, 24, 6, 0, 0, 'Europe/Brussels'),
            'wordle_hour' => 8,
        ]);

        $nextUnlock = $this->gameService->getNextWordleUnlockTime($game);

        expect($nextUnlock->format('Y-m-d H:i'))->toBe('2026-01-26 08:00');
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

describe('getGamesNeedingEnding', function () {
    it('returns active games past their end time', function () {
        Carbon::setTestNow(Carbon::create(2026, 1, 28, 12, 0, 0));

        $expiredGame = Game::factory()->create([
            'status' => 'active',
            'ends_at' => Carbon::create(2026, 1, 28, 10, 0, 0),
        ]);

        $futureGame = Game::factory()->create([
            'status' => 'active',
            'ends_at' => Carbon::create(2026, 1, 29, 10, 0, 0),
        ]);

        $completedGame = Game::factory()->create([
            'status' => 'completed',
            'ends_at' => Carbon::create(2026, 1, 27, 10, 0, 0),
        ]);

        $games = $this->gameService->getGamesNeedingEnding();

        expect($games)->toHaveCount(1);
        expect($games->first()->id)->toBe($expiredGame->id);
    });
});

describe('endExpiredGame', function () {
    it('ends game and selects winner with highest points', function () {
        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create(['game_id' => $game->id, 'points' => 50]);
        $winner = Player::factory()->create(['game_id' => $game->id, 'points' => 100]);
        Player::factory()->create(['game_id' => $game->id, 'points' => 75]);

        $result = $this->gameService->endExpiredGame($game);

        $game->refresh();
        expect($game->status)->toBe('completed');
        expect($game->winner_id)->toBe($winner->id);
        expect($result['winner']->id)->toBe($winner->id);
    });

    it('ends game with no winner when there is a tie', function () {
        $game = Game::factory()->create(['status' => 'active']);

        Player::factory()->create(['game_id' => $game->id, 'points' => 100]);
        Player::factory()->create(['game_id' => $game->id, 'points' => 100]);

        $result = $this->gameService->endExpiredGame($game);

        $game->refresh();
        expect($game->status)->toBe('completed');
        expect($game->winner_id)->toBeNull();
        expect($result['winner'])->toBeNull();
    });

    it('ends game with no winner when no players', function () {
        $game = Game::factory()->create(['status' => 'active']);

        $result = $this->gameService->endExpiredGame($game);

        $game->refresh();
        expect($game->status)->toBe('completed');
        expect($game->winner_id)->toBeNull();
        expect($result['winner'])->toBeNull();
    });

    it('does not change non-active game', function () {
        $game = Game::factory()->create(['status' => 'completed']);
        $player = Player::factory()->create(['game_id' => $game->id, 'points' => 100]);

        $result = $this->gameService->endExpiredGame($game);

        expect($game->winner_id)->toBeNull();
        expect($result['winner'])->toBeNull();
    });
});
