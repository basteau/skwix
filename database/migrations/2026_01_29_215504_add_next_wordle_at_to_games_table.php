<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->timestamp('next_wordle_at')->nullable()->after('wordle_interval_hours');
        });

        // Note: next_wordle_at will be populated dynamically when:
        // 1. A game is activated (GameService::activateGame)
        // 2. A wordle interval passes (NotifyWordleAvailable command)
        // 3. Admin updates settings (AdminController::updateGameSettings)
        // This avoids coupling migration to service logic that may change.
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('next_wordle_at');
        });
    }
};
