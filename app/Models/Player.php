<?php

namespace App\Models;

use Carbon\Carbon;
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
        'last_guess_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'points' => 'integer',
            'last_guess_at' => 'datetime',
        ];
    }

    public function isOnCooldown(): bool
    {
        if (! $this->last_guess_at) {
            return false;
        }

        $cooldownHours = config('game.guess_cooldown_hours', 8);

        return $this->last_guess_at->copy()->addHours($cooldownHours)->isFuture();
    }

    public function getCooldownRemainingSeconds(): int
    {
        if (! $this->last_guess_at) {
            return 0;
        }

        $cooldownHours = config('game.guess_cooldown_hours', 8);
        $cooldownEndsAt = $this->last_guess_at->copy()->addHours($cooldownHours);

        if ($cooldownEndsAt->isPast()) {
            return 0;
        }

        return (int) now()->diffInSeconds($cooldownEndsAt);
    }

    public function getCooldownEndsAt(): ?Carbon
    {
        if (! $this->last_guess_at) {
            return null;
        }

        $cooldownHours = config('game.guess_cooldown_hours', 8);
        $cooldownEndsAt = Carbon::parse($this->last_guess_at)->addHours($cooldownHours);

        return $cooldownEndsAt->isFuture() ? $cooldownEndsAt : null;
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

    public function sabotagesPlaced(): HasMany
    {
        return $this->hasMany(Sabotage::class, 'saboteur_id');
    }

    public function sabotagesReceived(): HasMany
    {
        return $this->hasMany(Sabotage::class, 'target_id');
    }

    public function pendingSabotagesAgainst(): HasMany
    {
        return $this->hasMany(Sabotage::class, 'target_id')
            ->where('status', 'pending');
    }
}
