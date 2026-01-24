<?php

namespace App\Mail;

use App\Models\Game;
use App\Models\Player;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GameInvitation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Player $player,
        public Game $game,
    ) {}

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
                'loginUrl' => url('/lobby'),
                'startsAt' => $this->game->starts_at?->locale('nl')->isoFormat('D MMMM YYYY [om] HH:mm'),
            ],
        );
    }
}
