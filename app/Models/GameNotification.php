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

    /**
     * Get active notifications for a player that haven't been dismissed.
     * Returns formatted array ready for Inertia response.
     *
     * @return array<int, array{id: int, message: string, created_at: string}>
     */
    public static function getActiveForPlayer(Player $player): array
    {
        return static::where('game_id', $player->game_id)
            ->where('is_active', true)
            ->whereDoesntHave('dismissedByPlayers', fn ($q) => $q->where('player_id', $player->id))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'message' => $n->message,
                'created_at' => $n->created_at->toISOString(),
            ])
            ->toArray();
    }
}
