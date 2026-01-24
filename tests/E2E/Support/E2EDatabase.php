<?php

namespace Tests\E2E\Support;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Helper class for E2E database operations.
 */
class E2EDatabase
{
    /**
     * Migrate and seed the E2E database.
     */
    public static function setup(): void
    {
        Artisan::call('migrate:fresh', ['--env' => 'e2e', '--force' => true]);
    }

    /**
     * Reset database to clean state (truncate all tables).
     */
    public static function reset(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'");

        foreach ($tables as $table) {
            DB::table($table->name)->truncate();
        }

        DB::statement('PRAGMA foreign_keys = ON');
    }

    /**
     * Seed specific fixtures for a test scenario.
     */
    public static function seed(string $fixture): void
    {
        Artisan::call('db:seed', [
            '--class' => "Tests\\E2E\\Fixtures\\{$fixture}Seeder",
            '--env' => 'e2e',
            '--force' => true,
        ]);
    }

    /**
     * Create the E2E SQLite database file if it doesn't exist.
     */
    public static function ensureDatabase(): void
    {
        $dbPath = storage_path('e2e.sqlite');

        if (! file_exists($dbPath)) {
            touch($dbPath);
        }
    }
}
