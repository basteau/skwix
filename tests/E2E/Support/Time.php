<?php

namespace Tests\E2E\Support;

use Carbon\Carbon;

/**
 * Helper class for deterministic time control in E2E tests.
 */
class Time
{
    /**
     * Freeze time to the configured E2E_NOW value.
     */
    public static function freeze(): void
    {
        $now = config('e2e.now');

        if ($now) {
            Carbon::setTestNow(Carbon::parse($now));
        }
    }

    /**
     * Freeze time to a specific timestamp.
     */
    public static function freezeTo(string $timestamp): void
    {
        Carbon::setTestNow(Carbon::parse($timestamp));
    }

    /**
     * Unfreeze time (restore normal behavior).
     */
    public static function unfreeze(): void
    {
        Carbon::setTestNow(null);
    }

    /**
     * Advance frozen time by a given interval.
     */
    public static function advance(string $interval): void
    {
        $current = Carbon::now();
        Carbon::setTestNow($current->add($interval));
    }

    /**
     * Set time to before Wordle unlock (8:00 Brussels time).
     */
    public static function beforeWordleUnlock(): void
    {
        self::freezeTo('2026-01-01 07:30:00');
    }

    /**
     * Set time to after Wordle unlock (8:00 Brussels time).
     */
    public static function afterWordleUnlock(): void
    {
        self::freezeTo('2026-01-01 09:00:00');
    }
}
