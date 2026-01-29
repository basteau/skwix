<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->timestamp('cooldown_ends_at')->nullable()->after('last_guess_at');
        });

        // Migrate existing cooldowns using database-agnostic approach
        // Fetch players with active cooldowns and update them individually
        $players = DB::table('players')
            ->join('games', 'players.game_id', '=', 'games.id')
            ->whereNotNull('players.last_guess_at')
            ->select('players.id', 'players.last_guess_at', 'games.cooldown_hours')
            ->get();

        foreach ($players as $player) {
            $cooldownHours = $player->cooldown_hours ?? 8;
            $cooldownEndsAt = \Carbon\Carbon::parse($player->last_guess_at)->addHours($cooldownHours);

            DB::table('players')
                ->where('id', $player->id)
                ->update(['cooldown_ends_at' => $cooldownEndsAt]);
        }
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('cooldown_ends_at');
        });
    }
};
