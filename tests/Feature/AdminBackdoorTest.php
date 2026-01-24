<?php

use App\Models\User;

test('admin backdoor returns 404 with wrong token', function () {
    $response = $this->get('/sudo/wrongtoken');
    
    $response->assertStatus(404);
});

test('admin backdoor returns 404 when no token configured', function () {
    config(['app.admin_secret_token' => null]);
    
    $response = $this->get('/sudo/anytoken');
    
    $response->assertStatus(404);
});

test('admin backdoor logs in and redirects to admin with correct token', function () {
    config(['app.admin_secret_token' => 'testtoken']);
    
    $response = $this->get('/sudo/testtoken');
    
    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticated();
    $this->assertTrue(auth()->user()->is_admin);
});

test('admin backdoor uses existing admin user if available', function () {
    config(['app.admin_secret_token' => 'testtoken']);
    
    $existingAdmin = User::factory()->create([
        'is_admin' => true,
        'email' => 'person-a26e1223de@example.invalid',
    ]);
    
    $response = $this->get('/sudo/testtoken');
    
    $response->assertRedirect(route('admin.dashboard'));
    $this->assertAuthenticatedAs($existingAdmin);
});
