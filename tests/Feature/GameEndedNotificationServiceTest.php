<?php

use App\Mail\GameEnded;
use App\Models\Game;
use App\Models\Player;
use App\Services\GameEndedNotificationService;
use Illuminate\Support\Facades\Mail;

it('sends notification to all players', function () {
    Mail::fake();

    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $player1 = Player::factory()->for($game)->create(['email' => 'player1@test.com', 'points' => 100]);
    $player2 = Player::factory()->for($game)->create(['email' => 'player2@test.com', 'points' => 50]);
    $game->update(['winner_id' => $player1->id]);

    $service = new GameEndedNotificationService();
    $count = $service->notifyAllPlayers($game);

    expect($count)->toBe(2);

    Mail::assertQueued(GameEnded::class, 2);
    Mail::assertQueued(GameEnded::class, fn ($mail) => $mail->recipient->email === 'player1@test.com');
    Mail::assertQueued(GameEnded::class, fn ($mail) => $mail->recipient->email === 'player2@test.com');
});

it('includes correct rank for each player', function () {
    Mail::fake();

    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $winner = Player::factory()->for($game)->create(['email' => 'winner@test.com', 'points' => 100]);
    $second = Player::factory()->for($game)->create(['email' => 'second@test.com', 'points' => 50]);
    $third = Player::factory()->for($game)->create(['email' => 'third@test.com', 'points' => 25]);
    $game->update(['winner_id' => $winner->id]);

    $service = new GameEndedNotificationService();
    $service->notifyAllPlayers($game);

    Mail::assertQueued(GameEnded::class, fn ($mail) => 
        $mail->recipient->email === 'winner@test.com' && $mail->rank === 1
    );
    Mail::assertQueued(GameEnded::class, fn ($mail) => 
        $mail->recipient->email === 'second@test.com' && $mail->rank === 2
    );
    Mail::assertQueued(GameEnded::class, fn ($mail) => 
        $mail->recipient->email === 'third@test.com' && $mail->rank === 3
    );
});

it('handles game with no winner', function () {
    Mail::fake();

    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST', 'winner_id' => null]);
    $player1 = Player::factory()->for($game)->create(['email' => 'player1@test.com', 'points' => 50]);
    $player2 = Player::factory()->for($game)->create(['email' => 'player2@test.com', 'points' => 50]);

    $service = new GameEndedNotificationService();
    $count = $service->notifyAllPlayers($game);

    expect($count)->toBe(2);

    Mail::assertQueued(GameEnded::class, fn ($mail) => $mail->winner === null);
});
