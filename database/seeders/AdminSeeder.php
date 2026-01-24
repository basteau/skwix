<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'person-90a4989184@example.invalid'],
            [
                'name' => 'Admin',
                'code' => env('ADMIN_CODE', strtoupper(Str::random(8))),
                'is_admin' => true,
                'avatar' => null,
            ]
        );
    }
}
