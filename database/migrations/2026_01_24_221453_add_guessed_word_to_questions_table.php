<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite doesn't support modifying enum columns, so we need to handle this differently
        // First add the guessed_word column
        Schema::table('questions', function (Blueprint $table) {
            $table->string('guessed_word', 100)->nullable()->after('answer');
        });

        // For SQLite: Change answer column from enum to string to support 'winner' value
        // We need to recreate the table since SQLite doesn't support ALTER COLUMN
        if (DB::connection()->getDriverName() === 'sqlite') {
            // Create temp table, copy data, drop old, rename
            DB::statement('CREATE TABLE questions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                player_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                answer VARCHAR(10) NOT NULL,
                guessed_word VARCHAR(100),
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
            )');
            DB::statement('INSERT INTO questions_new SELECT * FROM questions');
            DB::statement('DROP TABLE questions');
            DB::statement('ALTER TABLE questions_new RENAME TO questions');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('guessed_word');
        });
    }
};
