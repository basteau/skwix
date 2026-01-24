<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PlayerSeeder extends Seeder
{
    public function run(): void
    {
        $players = [
            'Player09',
            'Player07',
            'Player06',
            'Player08',
            'Player05',
            'Player04',
            'Player01',
            'Player02',
        ];

        foreach ($players as $name) {
            $slug = strtolower($name);

            User::updateOrCreate(
                ['email' => "{$slug}@skwix.game"],
                [
                    'name' => $name,
                    'code' => strtoupper(Str::random(8)),
                    'is_admin' => false,
                    'avatar' => "assets/players/portraits/{$slug}.png",
                ]
            );
        }
    }
}
