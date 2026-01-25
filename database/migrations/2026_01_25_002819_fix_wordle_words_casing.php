<?php

use App\Models\Game;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Game::whereNotNull('wordle_words')->each(function (Game $game) {
            $words = $game->wordle_words;
            if (is_array($words)) {
                $normalized = array_map('strtolower', $words);
                if ($words !== $normalized) {
                    $game->update(['wordle_words' => $normalized]);
                }
            }
        });
    }
};
