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
            [
                'name' => 'Player01',
                'email' => 'person-333680ec86@example.invalid',
                'avatar' => 'player01',
            ],
            [
                'name' => 'Player02',
                'email' => 'person-683cf2df33@example.invalid',
                'avatar' => 'player02',
            ],
            [
                'name' => 'Player03',
                'email' => 'person-c35e95817a@example.invalid',
                'avatar' => 'player03',
            ],
            [
                'name' => 'Player04',
                'email' => 'person-e8dd09c47b@example.invalid',
                'avatar' => 'player04',
            ],
            [
                'name' => 'Player05',
                'email' => 'person-ea72a66cf5@example.invalid',
                'avatar' => 'player05',
            ],
            [
                'name' => 'Player06',
                'email' => 'person-ff2be3a36c@example.invalid',
                'avatar' => 'player06',
            ],
            [
                'name' => 'Player07',
                'email' => 'person-3b77d98e8b@example.invalid',
                'avatar' => 'player07',
            ],
            [
                'name' => 'Player08',
                'email' => 'person-e36fa31c7d@example.invalid',
                'avatar' => 'player08',
            ],
        ];

        foreach ($players as $player) {
            $code = strtoupper(Str::random(6));
            $avatarPath = "assets/players/portraits/{$player['avatar']}.png";

            User::updateOrCreate(
                ['email' => $player['email']],
                [
                    'name' => $player['name'],
                    'code' => $code,
                    'is_admin' => false,
                    'avatar' => $avatarPath,
                ]
            );
        }
    }
}
