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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('secret_word', 100);
            $table->enum('status', ['pending', 'active', 'completed'])->default('pending');
            $table->unsignedBigInteger('winner_id')->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->json('wordle_words');
            $table->timestamps();

            $table->foreign('winner_id')->references('id')->on('players')->nullOnDelete();
        });

        Schema::table('players', function (Blueprint $table) {
            $table->foreign('game_id')->references('id')->on('games')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
