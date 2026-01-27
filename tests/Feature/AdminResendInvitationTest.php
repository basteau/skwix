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

it('resends invitation to a specific player', function () {
    $game = Game::factory()->create(['status' => 'pending']);
    $player = Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    Mail::assertQueued(GameInvitation::class, function ($mail) use ($player) {
        return $mail->hasTo($player->email);
    });
});

it('resends invitation for draft game', function () {
    $game = Game::factory()->create(['status' => 'draft']);
    $player = Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    Mail::assertQueuedCount(1);
});

it('resends invitation for active game', function () {
    $game = Game::factory()->active()->create();
    $player = Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('success');

    Mail::assertQueuedCount(1);
});

it('rejects resend for completed game', function () {
    $game = Game::factory()->create(['status' => 'completed']);
    $player = Player::factory()->for($game)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error', 'Spel is al beëindigd');

    Mail::assertNothingQueued();
});

it('rejects resend for player not in game', function () {
    $game = Game::factory()->create(['status' => 'pending']);
    $otherGame = Game::factory()->create(['status' => 'pending']);
    $player = Player::factory()->for($otherGame)->create();

    $response = $this->actingAs($this->admin)
        ->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertRedirect("/admin/game/{$game->id}");
    $response->assertSessionHas('error', 'Speler hoort niet bij dit spel');

    Mail::assertNothingQueued();
});

it('requires admin authentication', function () {
    $regularUser = User::factory()->create(['is_admin' => false]);
    $game = Game::factory()->create(['status' => 'pending']);
    $player = Player::factory()->for($game)->create();

    $response = $this->actingAs($regularUser)
        ->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertForbidden();

    Mail::assertNothingQueued();
});

it('requires authentication', function () {
    $game = Game::factory()->create(['status' => 'pending']);
    $player = Player::factory()->for($game)->create();

    $response = $this->post("/admin/game/{$game->id}/player/{$player->id}/resend");

    $response->assertRedirect('/welcome');

    Mail::assertNothingQueued();
});
