<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'name',
        'email',
        'avatar_url',
        'points',
        'invite_code',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'points' => 'integer',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
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
