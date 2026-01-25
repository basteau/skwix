<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Player>
 */
class PlayerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'game_id' => Game::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'avatar_url' => 'https://example.com/avatar.png',
            'points' => 0,
            'invite_code' => Str::random(8),
            'joined_at' => null,
        ];
    }

    public function joined(): static
    {
        return $this->state(fn (array $attributes) => [
            'joined_at' => now(),
        ]);
    }
}
