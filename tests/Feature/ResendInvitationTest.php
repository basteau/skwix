<?php

use App\Mail\GameInvitation;
use App\Models\Game;
use App\Models\Player;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    Cache::flush();
});

it('sends invitation email when player exists in active game', function () {
    $game = Game::factory()->active()->create();
    $player = Player::factory()->for($game)->create([
        'email' => 'test@example.com',
    ]);

    $response = $this->postJson('/resend-invitation', [
        'email' => 'test@example.com',
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'Als dit e-mailadres bekend is, ontvang je binnen enkele minuten je code.',
        ]);

    Mail::assertQueued(GameInvitation::class, function ($mail) use ($player) {
        return $mail->hasTo($player->email);
    });
});

it('returns same success message when email not found', function () {
    $response = $this->postJson('/resend-invitation', [
        'email' => 'unknown@example.com',
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'Als dit e-mailadres bekend is, ontvang je binnen enkele minuten je code.',
        ]);

    Mail::assertNothingQueued();
});

it('does not send email for player in non-active game', function () {
    $game = Game::factory()->create(['status' => 'pending']);
    Player::factory()->for($game)->create([
        'email' => 'pending@example.com',
    ]);

    $response = $this->postJson('/resend-invitation', [
        'email' => 'pending@example.com',
    ]);

    $response->assertOk();
    Mail::assertNothingQueued();
});

it('validates email is required', function () {
    $response = $this->postJson('/resend-invitation', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('validates email format', function () {
    $response = $this->postJson('/resend-invitation', [
        'email' => 'not-an-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('rate limits to 3 requests per email per hour', function () {
    $game = Game::factory()->active()->create();
    Player::factory()->for($game)->create([
        'email' => 'limited@example.com',
    ]);

    for ($i = 0; $i < 3; $i++) {
        $this->postJson('/resend-invitation', ['email' => 'limited@example.com'])
            ->assertOk();
    }

    Mail::assertQueuedCount(3);
    Mail::fake();

    $this->postJson('/resend-invitation', ['email' => 'limited@example.com'])
        ->assertOk();

    Mail::assertNothingQueued();
});

it('handles email case insensitively', function () {
    $game = Game::factory()->active()->create();
    Player::factory()->for($game)->create([
        'email' => 'Test@Example.COM',
    ]);

    $response = $this->postJson('/resend-invitation', [
        'email' => 'test@example.com',
    ]);

    $response->assertOk();
    Mail::assertQueued(GameInvitation::class);
});
