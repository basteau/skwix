<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'person-0801dfbc9f@example.invalid'],
            [
                'name' => 'John Doe',
                'code' => 'JOHNDOE1',
                'is_admin' => false,
                'avatar' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'person-e28a5d2715@example.invalid'],
            [
                'name' => 'Jane Doe',
                'code' => 'JANEDOE1',
                'is_admin' => false,
                'avatar' => null,
            ]
        );
    }
}
