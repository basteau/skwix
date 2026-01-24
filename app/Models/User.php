<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'code',
        'is_admin',
        'avatar',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'code',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
        ];
    }

    public function players(): HasMany
    {
        return $this->hasMany(Player::class, 'email', 'email');
    }

    public function activePlayer(): ?Player
    {
        return $this->players()
            ->whereHas('game', fn ($q) => $q->where('status', 'active'))
            ->first();
    }
}
