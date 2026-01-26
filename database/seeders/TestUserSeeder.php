<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'person-c7cc634778@example.invalid'],
            [
                'code' => 'JOHNDOE1',
                'name' => 'John Doe',
                'is_admin' => false,
                'avatar' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'person-e28a5d2715@example.invalid'],
            [
                'code' => 'JANEDOE1',
                'name' => 'Jane Doe',
                'is_admin' => false,
                'avatar' => null,
            ]
        );
    }
}
