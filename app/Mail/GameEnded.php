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

class GameEnded extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 10;

    public function __construct(
        public Player $recipient,
        public Game $game,
        public ?Player $winner,
        public int $rank,
        public int $totalPlayers,
    ) {}

    public function middleware(): array
    {
        return [new RateLimited('emails')];
    }

    public function envelope(): Envelope
    {
        $subject = $this->winner && $this->winner->id === $this->recipient->id
            ? 'Gefeliciteerd! Je hebt Skwix gewonnen! 🏆'
            : 'Skwix is afgelopen! ❄️';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.game-ended',
            with: [
                'recipientName' => $this->recipient->name,
                'recipientPoints' => $this->recipient->points,
                'recipientRank' => $this->rank,
                'isWinner' => $this->winner && $this->winner->id === $this->recipient->id,
                'winnerName' => $this->winner?->name,
                'winnerPoints' => $this->winner?->points,
                'secretWord' => $this->game->secret_word,
                'totalPlayers' => $this->totalPlayers,
                'resultsUrl' => url('/lobby'),
            ],
        );
    }
}
