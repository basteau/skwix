<?php

namespace App\Services;

use App\Models\Player;
use App\Models\Question;
use App\Models\Sabotage;
use Illuminate\Support\Facades\DB;

class SabotageService
{
    /**
     * Place a sabotage on a target player.
     *
     * @return array{success: bool, error?: string, sabotage?: Sabotage}
     */
    public function placeSabotage(Player $saboteur, Player $target): array
    {
        if ($saboteur->id === $target->id) {
            return ['success' => false, 'error' => 'cannot_sabotage_self'];
        }

        if ($saboteur->game_id !== $target->game_id) {
            return ['success' => false, 'error' => 'different_games'];
        }

        $cost = config('game.sabotage_cost');

        if ($saboteur->points < $cost) {
            return ['success' => false, 'error' => 'insufficient_points'];
        }

        $existingPending = Sabotage::where('saboteur_id', $saboteur->id)
            ->where('target_id', $target->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return ['success' => false, 'error' => 'already_pending'];
        }

        $sabotage = DB::transaction(function () use ($saboteur, $target, $cost) {
            $saboteur->decrement('points', $cost);

            return Sabotage::create([
                'game_id' => $saboteur->game_id,
                'saboteur_id' => $saboteur->id,
                'target_id' => $target->id,
                'status' => 'pending',
            ]);
        });

        return ['success' => true, 'sabotage' => $sabotage];
    }

    /**
     * Check if player has a pending sabotage and consume it.
     * Returns the sabotage if one was applied.
     */
    public function consumePendingSabotage(Player $player, Question $question): ?Sabotage
    {
        return DB::transaction(function () use ($player, $question) {
            $sabotage = Sabotage::where('target_id', $player->id)
                ->where('status', 'pending')
                ->orderBy('created_at', 'asc')
                ->lockForUpdate()
                ->first();

            if ($sabotage) {
                $sabotage->update([
                    'status' => 'applied',
                    'question_id' => $question->id,
                ]);
            }

            return $sabotage;
        });
    }

    /**
     * Flip an answer when sabotaged.
     * yes -> no, no -> yes, unknown/unclear/winner stay unchanged.
     */
    public function flipAnswer(string $answer): string
    {
        return match ($answer) {
            'yes' => 'no',
            'no' => 'yes',
            default => $answer,
        };
    }

    /**
     * Reveal sabotages on player's own questions.
     * Marks all unrevealed sabotages as revealed and returns the question IDs.
     *
     * @return array{success: bool, error?: string, sabotaged_question_ids?: array<int>}
     */
    public function revealSabotages(Player $player): array
    {
        $cost = config('game.reveal_cost');

        if ($player->points < $cost) {
            return ['success' => false, 'error' => 'insufficient_points'];
        }

        $sabotagedQuestionIds = DB::transaction(function () use ($player, $cost) {
            $player->decrement('points', $cost);

            // Mark all unrevealed sabotages as revealed
            Sabotage::where('target_id', $player->id)
                ->where('status', 'applied')
                ->whereNull('revealed_at')
                ->update(['revealed_at' => now()]);

            // Return ALL revealed question IDs (including previously revealed)
            return Sabotage::where('target_id', $player->id)
                ->where('status', 'applied')
                ->whereNotNull('question_id')
                ->whereNotNull('revealed_at')
                ->pluck('question_id')
                ->toArray();
        });

        return [
            'success' => true,
            'sabotaged_question_ids' => $sabotagedQuestionIds,
        ];
    }

    /**
     * Get question IDs that have been revealed as sabotaged for a player.
     *
     * @return array<int>
     */
    public function getRevealedSabotagedQuestionIds(Player $player): array
    {
        return Sabotage::where('target_id', $player->id)
            ->where('status', 'applied')
            ->whereNotNull('question_id')
            ->whereNotNull('revealed_at')
            ->pluck('question_id')
            ->toArray();
    }

    /**
     * Check if player has any unrevealed sabotages (can pay to reveal).
     */
    public function hasUnrevealedSabotages(Player $player): bool
    {
        return Sabotage::where('target_id', $player->id)
            ->where('status', 'applied')
            ->whereNull('revealed_at')
            ->exists();
    }

    /**
     * Get count of applied sabotages against a player.
     */
    public function getAppliedSabotageCount(Player $player): int
    {
        return Sabotage::where('target_id', $player->id)
            ->where('status', 'applied')
            ->count();
    }

    /**
     * Get count of pending sabotages against a player.
     */
    public function getPendingSabotageCount(Player $player): int
    {
        return Sabotage::where('target_id', $player->id)
            ->where('status', 'pending')
            ->count();
    }
}
