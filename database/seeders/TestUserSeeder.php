<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['code' => 'JOHNDOE1'],
            [
                'name' => 'John Doe',
                'email' => 'person-c7cc634778@example.invalid',
                'is_admin' => false,
                'avatar' => null,
            ]
        );

        User::updateOrCreate(
            ['code' => 'JANEDOE1'],
            [
                'name' => 'Jane Doe',
                'email' => 'person-e28a5d2715@example.invalid',
                'is_admin' => false,
                'avatar' => null,
            ]
        );
    }
}
