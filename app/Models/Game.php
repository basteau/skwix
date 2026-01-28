<?php

namespace App\Models;

use App\Observers\GameObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(GameObserver::class)]
class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'secret_word',
        'word_description',
        'status',
        'winner_id',
        'starts_at',
        'ends_at',
        'wordle_words',
        'wordle_hour',
        'starting_points',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'wordle_words' => 'array',
            'wordle_hour' => 'integer',
            'starting_points' => 'integer',
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

    public function notifications(): HasMany
    {
        return $this->hasMany(GameNotification::class);
    }
}
