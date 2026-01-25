<?php

namespace Tests\E2E\Support;

use Carbon\Carbon;

/**
 * Helper class for deterministic time control in E2E tests.
 *
 * Uses dynamic future dates to avoid session cookie expiration issues.
 * Cookie Max-Age = (frozen_time + session_lifetime) - real_time
 * Using "tomorrow" ensures cookies never expire prematurely.
 */
class Time
{
    /**
     * Freeze time to tomorrow 9:00 AM Brussels (after wordle unlock).
     * Always uses a future date to avoid 419 cookie errors.
     */
    public static function freeze(): void
    {
        $tomorrow = Carbon::tomorrow('Europe/Brussels')->setTime(9, 0, 0);
        Carbon::setTestNow($tomorrow);
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
     * Uses tomorrow 7:30 AM - before the 8:00 cutoff.
     */
    public static function beforeWordleUnlock(): void
    {
        $tomorrow = Carbon::tomorrow('Europe/Brussels')->setTime(7, 30, 0);
        Carbon::setTestNow($tomorrow);
    }

    /**
     * Set time to after Wordle unlock (8:00 Brussels time).
     * Uses tomorrow 9:00 AM - after the 8:00 cutoff.
     */
    public static function afterWordleUnlock(): void
    {
        $tomorrow = Carbon::tomorrow('Europe/Brussels')->setTime(9, 0, 0);
        Carbon::setTestNow($tomorrow);
    }
}
