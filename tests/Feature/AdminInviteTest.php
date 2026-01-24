<?php

use App\Mail\GameInvitation;
use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();

    $this->admin = User::factory()->create(['is_admin' => true]);
});

it('sends invitations to all players for a draft game', function () {
    $game = Game::factory()->create(['status' => 'draft']);
    $players = Player::factory()->count(3)->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/invite");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    Mail::assertQueuedCount(3);
    foreach ($players as $player) {
        Mail::assertQueued(GameInvitation::class, function ($mail) use ($player) {
            return $mail->hasTo($player->email);
        });
    }

    $game->refresh();
    expect($game->status)->toBe('pending');
});

it('rejects inviting already invited game', function () {
    $game = Game::factory()->create(['status' => 'pending']);
    Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/invite");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error', 'Uitnodigingen zijn al verstuurd');

    Mail::assertNothingQueued();
});

it('rejects inviting active game', function () {
    $game = Game::factory()->active()->create();
    Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/invite");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error');

    Mail::assertNothingQueued();
});

it('rejects inviting completed game', function () {
    $game = Game::factory()->create(['status' => 'completed']);
    Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/invite");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error');

    Mail::assertNothingQueued();
});

it('requires admin authentication', function () {
    $regularUser = User::factory()->create(['is_admin' => false]);
    $game = Game::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($regularUser)
        ->post("/admin/game/{$game->id}/invite");

    $response->assertForbidden();

    Mail::assertNothingQueued();
});

it('requires authentication', function () {
    $game = Game::factory()->create(['status' => 'draft']);

    $response = $this->post("/admin/game/{$game->id}/invite");

    $response->assertRedirect('/welcome');

    Mail::assertNothingQueued();
});
