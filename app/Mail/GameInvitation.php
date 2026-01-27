<?php

namespace App\Mail;

use App\Models\Game;
use App\Models\Player;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Queue\SerializesModels;

class GameInvitation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 10;

    public function __construct(
        public Player $player,
        public Game $game,
    ) {}

    public function middleware(): array
    {
        return [new RateLimited('emails')];
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Je bent uitgenodigd voor Skwix! ❄️',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.game-invitation',
            with: [
                'playerName' => $this->player->name,
                'inviteCode' => $this->player->invite_code,
                'loginUrl' => url('/welcome'),
                'startsAt' => $this->game->starts_at?->locale('nl')->isoFormat('D MMMM YYYY [om] HH:mm'),
                'avatarUrl' => $this->getAvatarUrl($this->player->avatar_url),
            ],
        );
    }

    private function getAvatarUrl(?string $avatar): ?string
    {
        if (! $avatar) {
            return null;
        }
        if (str_starts_with($avatar, 'http')) {
            return $avatar;
        }
        if (str_starts_with($avatar, '/')) {
            return url($avatar);
        }
        $name = str_ends_with($avatar, '.png') ? substr($avatar, 0, -4) : $avatar;

        return url("/images/faces/{$name}.png");
    }
}
