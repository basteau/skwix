<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WordleAttempt extends Model
{
    use HasFactory;
    protected $fillable = [
        'game_id',
        'player_id',
        'day_number',
        'guesses',
        'completed',
        'points_earned',
    ];

    protected function casts(): array
    {
        return [
            'guesses' => 'array',
            'completed' => 'boolean',
            'day_number' => 'integer',
            'points_earned' => 'integer',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
