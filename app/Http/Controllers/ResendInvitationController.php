<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResendInvitationRequest;
use App\Mail\GameInvitation;
use App\Models\Player;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class ResendInvitationController extends Controller
{
    public function __invoke(ResendInvitationRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->validated('email')));
        $cacheKey = 'resend_invitation:'.md5($email);

        $attempts = Cache::get($cacheKey, 0);
        if ($attempts >= 3) {
            return response()->json([
                'message' => 'Als dit e-mailadres bekend is, ontvang je binnen enkele minuten je code.',
            ]);
        }

        Cache::put($cacheKey, $attempts + 1, now()->addHour());

        $player = Player::whereRaw('LOWER(email) = ?', [$email])
            ->whereHas('game', fn ($q) => $q->where('status', 'active'))
            ->with('game')
            ->first();

        if ($player) {
            Mail::to($player->email)->queue(new GameInvitation($player, $player->game));
        }

        return response()->json([
            'message' => 'Als dit e-mailadres bekend is, ontvang je binnen enkele minuten je code.',
        ]);
    }
}
