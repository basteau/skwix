<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GameNotification extends Model
{
    protected $fillable = [
        'game_id',
        'message',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function dismissedByPlayers(): BelongsToMany
    {
        return $this->belongsToMany(Player::class, 'game_notification_dismissals')
            ->withPivot('dismissed_at');
    }

    /**
     * Check if a player has dismissed this notification.
     */
    public function isDismissedBy(Player $player): bool
    {
        return $this->dismissedByPlayers()->where('player_id', $player->id)->exists();
    }
}
