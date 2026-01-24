<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    protected $fillable = [
        'secret_word',
        'status',
        'winner_id',
        'starts_at',
        'ends_at',
        'wordle_words',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'wordle_words' => 'array',
        ];
    }

    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'winner_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function wordleAttempts(): HasMany
    {
        return $this->hasMany(WordleAttempt::class);
    }

    public function spinResults(): HasMany
    {
        return $this->hasMany(SpinResult::class);
    }
}
