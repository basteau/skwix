<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpinResult extends Model
{
    use HasFactory;
    protected $fillable = [
        'game_id',
        'player_id',
        'amount_wagered',
        'won',
        'points_change',
    ];

    protected function casts(): array
    {
        return [
            'amount_wagered' => 'integer',
            'won' => 'boolean',
            'points_change' => 'integer',
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
