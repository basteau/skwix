<?php

namespace Database\Factories;

use App\Models\Game;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    public function definition(): array
    {
        return [
            'secret_word' => Str::random(5),
            'status' => 'pending',
            'winner_id' => null,
            'starts_at' => Carbon::now()->addDay(),
            'ends_at' => null,
            'wordle_words' => ['woord', 'appel', 'tafel', 'stoel', 'kamer'],
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'starts_at' => Carbon::now()->subDay(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'starts_at' => Carbon::now()->subWeek(),
            'ends_at' => Carbon::now()->subDay(),
        ]);
    }
}
