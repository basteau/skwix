<?php

use App\Mail\GameEnded;
use App\Models\Game;
use App\Models\Player;

it('has congratulations subject for winner', function () {
    $game = Game::factory()->create([
        'status' => 'completed',
        'secret_word' => 'GEHEIM',
    ]);
    $winner = Player::factory()->for($game)->create(['name' => 'Winnaar', 'points' => 100]);
    $game->update(['winner_id' => $winner->id]);

    $mailable = new GameEnded(
        recipient: $winner,
        game: $game,
        winner: $winner,
        rank: 1,
        totalPlayers: 2,
    );

    $mailable->assertHasSubject('Gefeliciteerd! Je hebt Skwix gewonnen! 🏆');
});

it('has game ended subject for non-winner', function () {
    $game = Game::factory()->create([
        'status' => 'completed',
        'secret_word' => 'GEHEIM',
    ]);
    $winner = Player::factory()->for($game)->create(['name' => 'Winnaar', 'points' => 100]);
    $loser = Player::factory()->for($game)->create(['name' => 'Verliezer', 'points' => 50]);
    $game->update(['winner_id' => $winner->id]);

    $mailable = new GameEnded(
        recipient: $loser,
        game: $game,
        winner: $winner,
        rank: 2,
        totalPlayers: 2,
    );

    $mailable->assertHasSubject('Skwix is afgelopen! ❄️');
});

it('contains recipient name', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $player = Player::factory()->for($game)->create(['name' => 'Test Speler', 'points' => 50]);

    $mailable = new GameEnded(
        recipient: $player,
        game: $game,
        winner: null,
        rank: 1,
        totalPlayers: 1,
    );

    $mailable->assertSeeInHtml('Test Speler');
});

it('displays secret word', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'GEHEIM']);
    $player = Player::factory()->for($game)->create(['points' => 50]);

    $mailable = new GameEnded(
        recipient: $player,
        game: $game,
        winner: null,
        rank: 1,
        totalPlayers: 1,
    );

    $mailable->assertSeeInHtml('GEHEIM');
});

it('shows recipient rank and points', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $player = Player::factory()->for($game)->create(['points' => 75]);

    $mailable = new GameEnded(
        recipient: $player,
        game: $game,
        winner: null,
        rank: 2,
        totalPlayers: 5,
    );

    $mailable->assertSeeInHtml('#2');
    $mailable->assertSeeInHtml('van 5');
    $mailable->assertSeeInHtml('75');
});

it('shows winner content for winning recipient', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $winner = Player::factory()->for($game)->create(['points' => 100]);
    $game->update(['winner_id' => $winner->id]);

    $mailable = new GameEnded(
        recipient: $winner,
        game: $game,
        winner: $winner,
        rank: 1,
        totalPlayers: 2,
    );

    $mailable->assertSeeInHtml('Gefeliciteerd!');
    $mailable->assertSeeInHtml('Bekijk je prijs 🏆');
});

it('shows winner name for non-winner', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $winner = Player::factory()->for($game)->create(['name' => 'De Winnaar', 'points' => 100]);
    $loser = Player::factory()->for($game)->create(['points' => 50]);
    $game->update(['winner_id' => $winner->id]);

    $mailable = new GameEnded(
        recipient: $loser,
        game: $game,
        winner: $winner,
        rank: 2,
        totalPlayers: 2,
    );

    $mailable->assertSeeInHtml('De Winnaar');
    $mailable->assertSeeInHtml('Bekijk resultaten ❄️');
});

it('handles tie with no winner', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $player = Player::factory()->for($game)->create(['points' => 50]);

    $mailable = new GameEnded(
        recipient: $player,
        game: $game,
        winner: null,
        rank: 1,
        totalPlayers: 2,
    );

    $mailable->assertSeeInHtml('Er was geen duidelijke winnaar (gelijke stand)');
});

it('implements should queue interface', function () {
    expect(GameEnded::class)->toImplement(Illuminate\Contracts\Queue\ShouldQueue::class);
});

it('contains results url', function () {
    $game = Game::factory()->create(['status' => 'completed', 'secret_word' => 'TEST']);
    $player = Player::factory()->for($game)->create(['points' => 50]);

    $mailable = new GameEnded(
        recipient: $player,
        game: $game,
        winner: null,
        rank: 1,
        totalPlayers: 1,
    );

    $mailable->assertSeeInHtml(url('/lobby'));
});
