<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->unsignedTinyInteger('cooldown_hours')->default(8)->after('wordle_hour');
            $table->unsignedTinyInteger('wordle_interval_hours')->default(24)->after('cooldown_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['cooldown_hours', 'wordle_interval_hours']);
        });
    }
};
