<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Status column already supports 'draft' as string - no changes needed
        // This migration is kept for history but is now a no-op since
        // the base migration was updated to use string instead of enum
    }

    public function down(): void
    {
        // No-op
    }
};
