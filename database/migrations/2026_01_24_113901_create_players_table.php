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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('game_id');
            $table->string('name');
            $table->string('email');
            $table->string('avatar_url')->nullable();
            $table->integer('points')->default(0);
            $table->string('invite_code', 32)->unique();
            $table->timestamp('joined_at')->nullable();
            $table->json('wordle_guesses')->nullable();
            $table->timestamps();

            $table->index('game_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
