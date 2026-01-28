<?php

use App\Models\Game;
use App\Models\GameNotification;
use App\Models\Player;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['is_admin' => true]);
    $this->game = Game::factory()->active()->create();
    $this->player = Player::factory()->for($this->game)->create([
        'email' => 'player@example.com',
    ]);
    $this->user = User::factory()->create([
        'email' => 'player@example.com',
    ]);
});

describe('Admin Notification Management', function () {
    it('allows admin to create notification for a game', function () {
        $response = $this->actingAs($this->admin)
            ->postJson("/admin/game/{$this->game->id}/notification", [
                'message' => 'Test notification message',
            ]);

        $response->assertSuccessful()
            ->assertJson(['success' => true]);

        expect($response->json('notification'))->toHaveKey('id')
            ->and($response->json('notification.message'))->toBe('Test notification message')
            ->and($response->json('notification.is_active'))->toBeTrue();

        $this->assertDatabaseHas('game_notifications', [
            'game_id' => $this->game->id,
            'message' => 'Test notification message',
            'is_active' => true,
        ]);
    });

    it('rejects notification creation for completed game', function () {
        $this->game->update(['status' => 'completed']);

        $response = $this->actingAs($this->admin)
            ->postJson("/admin/game/{$this->game->id}/notification", [
                'message' => 'Test notification message',
            ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'game_completed']);

        $this->assertDatabaseMissing('game_notifications', [
            'game_id' => $this->game->id,
        ]);
    });

    it('validates notification message is required', function () {
        $response = $this->actingAs($this->admin)
            ->postJson("/admin/game/{$this->game->id}/notification", [
                'message' => '',
            ]);

        $response->assertStatus(422);
    });

    it('validates notification message max length', function () {
        $response = $this->actingAs($this->admin)
            ->postJson("/admin/game/{$this->game->id}/notification", [
                'message' => str_repeat('a', 501),
            ]);

        $response->assertStatus(422);
    });

    it('allows admin to toggle notification', function () {
        $notification = GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Test message',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/admin/game/{$this->game->id}/notification/{$notification->id}/toggle");

        $response->assertSuccessful()
            ->assertJson(['success' => true, 'is_active' => false]);

        $notification->refresh();
        expect($notification->is_active)->toBeFalse();

        // Toggle back
        $response = $this->actingAs($this->admin)
            ->patchJson("/admin/game/{$this->game->id}/notification/{$notification->id}/toggle");

        $response->assertSuccessful()
            ->assertJson(['success' => true, 'is_active' => true]);

        $notification->refresh();
        expect($notification->is_active)->toBeTrue();
    });

    it('allows admin to delete notification', function () {
        $notification = GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Test message',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/admin/game/{$this->game->id}/notification/{$notification->id}");

        $response->assertSuccessful()
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('game_notifications', [
            'id' => $notification->id,
        ]);
    });

    it('rejects toggling notification from different game', function () {
        $otherGame = Game::factory()->active()->create();
        $notification = GameNotification::create([
            'game_id' => $otherGame->id,
            'message' => 'Test message',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/admin/game/{$this->game->id}/notification/{$notification->id}/toggle");

        $response->assertStatus(400)
            ->assertJson(['error' => 'invalid_notification']);
    });

    it('requires admin authentication', function () {
        $regularUser = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($regularUser)
            ->postJson("/admin/game/{$this->game->id}/notification", [
                'message' => 'Test message',
            ]);

        $response->assertForbidden();
    });
});

describe('Player Notification Dismissal', function () {
    it('allows player to dismiss notification', function () {
        $notification = GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Test message',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/play/notification/{$notification->id}/dismiss");

        $response->assertSuccessful()
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('game_notification_dismissals', [
            'game_notification_id' => $notification->id,
            'player_id' => $this->player->id,
        ]);
    });

    it('handles already dismissed notification gracefully', function () {
        $notification = GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Test message',
            'is_active' => true,
        ]);

        // First dismissal
        $this->actingAs($this->user)
            ->postJson("/play/notification/{$notification->id}/dismiss");

        // Second dismissal
        $response = $this->actingAs($this->user)
            ->postJson("/play/notification/{$notification->id}/dismiss");

        $response->assertSuccessful()
            ->assertJson(['success' => true, 'already_dismissed' => true]);
    });

    it('rejects dismissing notification from different game', function () {
        $otherGame = Game::factory()->active()->create();
        $notification = GameNotification::create([
            'game_id' => $otherGame->id,
            'message' => 'Test message',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/play/notification/{$notification->id}/dismiss");

        $response->assertStatus(400)
            ->assertJson(['error' => 'invalid_notification']);
    });
});

describe('Notification Display in Game', function () {
    it('shows active notifications on guess page', function () {
        $notification = GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Important announcement',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/play/guess');

        $response->assertSuccessful();
        $response->assertInertia(
            fn ($page) => $page
                ->component('play/guess')
                ->has('notifications', 1)
                ->where('notifications.0.message', 'Important announcement')
        );
    });

    it('does not show dismissed notifications', function () {
        $notification = GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Important announcement',
            'is_active' => true,
        ]);

        // Dismiss the notification
        $notification->dismissedByPlayers()->attach($this->player->id, [
            'dismissed_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/play/guess');

        $response->assertSuccessful();
        $response->assertInertia(
            fn ($page) => $page
                ->component('play/guess')
                ->has('notifications', 0)
        );
    });

    it('does not show inactive notifications', function () {
        GameNotification::create([
            'game_id' => $this->game->id,
            'message' => 'Inactive notification',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/play/guess');

        $response->assertSuccessful();
        $response->assertInertia(
            fn ($page) => $page
                ->component('play/guess')
                ->has('notifications', 0)
        );
    });
});
