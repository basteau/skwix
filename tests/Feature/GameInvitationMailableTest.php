<?php

use App\Mail\GameInvitation;
use App\Models\Game;
use App\Models\Player;

it('has correct subject line', function () {
    $game = Game::factory()->create(['starts_at' => now()->addDay()]);
    $player = Player::factory()->for($game)->create();

    $mailable = new GameInvitation($player, $game);

    $mailable->assertHasSubject('Je bent uitgenodigd voor Skwix! ❄️');
});

it('contains player name greeting', function () {
    $game = Game::factory()->create(['starts_at' => now()->addDay()]);
    $player = Player::factory()->for($game)->create(['name' => 'Test Speler']);

    $mailable = new GameInvitation($player, $game);

    $mailable->assertSeeInHtml('Test Speler');
});

it('displays invite code prominently', function () {
    $game = Game::factory()->create(['starts_at' => now()->addDay()]);
    $player = Player::factory()->for($game)->create(['invite_code' => 'ABC123']);

    $mailable = new GameInvitation($player, $game);

    $mailable->assertSeeInHtml('ABC123');
});

it('contains login url with cta', function () {
    $game = Game::factory()->create(['starts_at' => now()->addDay()]);
    $player = Player::factory()->for($game)->create();

    $mailable = new GameInvitation($player, $game);

    $mailable->assertSeeInHtml(url('/lobby'));
    $mailable->assertSeeInHtml('Spelen!');
});

it('shows game start date when present', function () {
    $startsAt = now()->addDays(3)->setTime(14, 0);
    $game = Game::factory()->create(['starts_at' => $startsAt]);
    $player = Player::factory()->for($game)->create();

    $mailable = new GameInvitation($player, $game);

    $mailable->assertSeeInHtml('Het spel start op:');
});

it('contains skwix branding', function () {
    $game = Game::factory()->create(['starts_at' => now()->addDay()]);
    $player = Player::factory()->for($game)->create();

    $mailable = new GameInvitation($player, $game);

    $mailable->assertSeeInHtml('Skwix');
    $mailable->assertSeeInHtml('Het winterse woordspel');
    $mailable->assertSeeInHtml('❄️');
});

it('implements should queue interface', function () {
    expect(GameInvitation::class)->toImplement(Illuminate\Contracts\Queue\ShouldQueue::class);
});

it('passes correct data to view', function () {
    $startsAt = now()->addDays(2)->setTime(10, 30);
    $game = Game::factory()->create(['starts_at' => $startsAt]);
    $player = Player::factory()->for($game)->create([
        'name' => 'Jan Test',
        'invite_code' => 'XYZ789',
    ]);

    $mailable = new GameInvitation($player, $game);
    $mailable->assertHasSubject('Je bent uitgenodigd voor Skwix! ❄️');

    $rendered = $mailable->render();

    expect($rendered)
        ->toContain('Jan Test')
        ->toContain('XYZ789')
        ->toContain(url('/lobby'));
});
