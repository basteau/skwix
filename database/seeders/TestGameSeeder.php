<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Player;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestGameSeeder extends Seeder
{
    public function run(): void
    {
        $game = Game::create([
            'secret_word' => 'geheim',
            'word_description' => 'Een test woord voor development',
            'status' => 'active',
            'starts_at' => Carbon::now()->subDay(),
            'ends_at' => null,
            'wordle_words' => ['appel', 'tafel', 'stoel', 'kamer', 'hond', 'plant', 'boter'],
            'wordle_hour' => 0,
            'starting_points' => 100,
        ]);

        $players = [
            ['name' => 'Pif', 'code' => 'PIF001', 'email' => 'pif@test.local'],
            ['name' => 'Paf', 'code' => 'PAF001', 'email' => 'paf@test.local'],
            ['name' => 'Pof', 'code' => 'POF001', 'email' => 'pof@test.local'],
        ];

        foreach ($players as $player) {
            // Create the User record (required for login)
            User::updateOrCreate(
                ['email' => $player['email']],
                [
                    'name' => $player['name'],
                    'code' => $player['code'],
                    'password' => Hash::make('test'),
                    'is_admin' => false,
                    'avatar' => null,
                ]
            );

            // Create the Player record
            Player::updateOrCreate(
                ['invite_code' => $player['code']],
                [
                    'game_id' => $game->id,
                    'name' => $player['name'],
                    'email' => $player['email'],
                    'points' => $game->starting_points,
                    'joined_at' => Carbon::now(),
                    'avatar_url' => null,
                ]
            );
        }
    }
}
