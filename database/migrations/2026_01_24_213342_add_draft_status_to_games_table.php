<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('
                CREATE TABLE games_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    secret_word VARCHAR(100) NOT NULL,
                    status VARCHAR(20) CHECK(status IN ("draft", "pending", "active", "completed")) DEFAULT "draft",
                    winner_id INTEGER,
                    starts_at DATETIME,
                    ends_at DATETIME,
                    wordle_words TEXT,
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL
                )
            ');

            DB::statement('INSERT INTO games_new SELECT * FROM games');
            DB::statement('DROP TABLE games');
            DB::statement('ALTER TABLE games_new RENAME TO games');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement("ALTER TABLE games MODIFY COLUMN status ENUM('draft', 'pending', 'active', 'completed') DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('
                CREATE TABLE games_old (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    secret_word VARCHAR(100) NOT NULL,
                    status VARCHAR(20) CHECK(status IN ("pending", "active", "completed")) DEFAULT "pending",
                    winner_id INTEGER,
                    starts_at DATETIME,
                    ends_at DATETIME,
                    wordle_words TEXT,
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL
                )
            ');

            DB::statement('INSERT INTO games_old SELECT * FROM games WHERE status != "draft"');
            DB::statement('DROP TABLE games');
            DB::statement('ALTER TABLE games_old RENAME TO games');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement("ALTER TABLE games MODIFY COLUMN status ENUM('pending', 'active', 'completed') DEFAULT 'pending'");
        }
    }
};
