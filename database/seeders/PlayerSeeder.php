<?php

namespace Database\Seeders;

use App\Models\Player;
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
            $email = "{$slug}@skwix.game";
            $code = strtoupper(Str::random(8));
            $avatar = "assets/players/portraits/{$slug}.png";

            // Create User for authentication (via Fortify)
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'code' => $code,
                    'is_admin' => false,
                    'avatar' => $avatar,
                ]
            );

            // Create Player for game context (linked via email)
            // Game ID will be set when admin creates the game
            // For now, this just prepares the player records
        }
    }
}
