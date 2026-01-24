<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvitationCodeAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_page_is_displayed(): void
    {
        $response = $this->get('/welcome');

        $response->assertStatus(200);
    }

    public function test_users_can_login_with_valid_code(): void
    {
        $user = User::factory()->create([
            'code' => 'TESTCODE',
        ]);

        $response = $this->post('/login', [
            'code' => 'TESTCODE',
        ]);

        $response->assertRedirect('/play/wordle');
        $this->assertAuthenticated();
    }

    public function test_users_cannot_login_with_invalid_code(): void
    {
        User::factory()->create([
            'code' => 'VALIDCODE',
        ]);

        $this->post('/login', [
            'code' => 'WRONGCODE',
        ]);

        $this->assertGuest();
    }

    public function test_authenticated_users_are_redirected_from_welcome(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/welcome');

        $response->assertRedirect('/play/wordle');
    }

    public function test_unauthenticated_users_are_redirected_to_welcome(): void
    {
        $response = $this->get('/play/wordle');

        $response->assertRedirect('/welcome');
    }

    public function test_admin_users_can_access_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertStatus(200);
    }

    public function test_regular_users_cannot_access_admin(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/admin');

        $response->assertStatus(403);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
    }
}
