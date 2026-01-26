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
     * Freeze time to tomorrow (wordle_hour + 1):00 AM Brussels (after wordle unlock).
     * Always uses a future date to avoid 419 cookie errors.
     */
    public static function freeze(int $wordleHour = 8): void
    {
        $afterHour = ($wordleHour + 1) % 24;
        $tomorrow = Carbon::tomorrow('Europe/Brussels')->setTime($afterHour, 0, 0);
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
     * Set time to before Wordle unlock (default 8:00 Brussels time).
     * Uses tomorrow (wordle_hour - 0.5):00 - before the cutoff.
     */
    public static function beforeWordleUnlock(int $wordleHour = 8): void
    {
        $beforeMinutes = $wordleHour * 60 - 30;
        $beforeHour = (int) floor($beforeMinutes / 60);
        $beforeMinute = $beforeMinutes % 60;
        if ($beforeHour < 0) {
            $beforeHour = 23;
            $beforeMinute = 30;
        }
        $tomorrow = Carbon::tomorrow('Europe/Brussels')->setTime($beforeHour, $beforeMinute, 0);
        Carbon::setTestNow($tomorrow);
    }

    /**
     * Set time to after Wordle unlock (default 8:00 Brussels time).
     * Uses tomorrow (wordle_hour + 1):00 - after the cutoff.
     */
    public static function afterWordleUnlock(int $wordleHour = 8): void
    {
        $afterHour = ($wordleHour + 1) % 24;
        $tomorrow = Carbon::tomorrow('Europe/Brussels')->setTime($afterHour, 0, 0);
        Carbon::setTestNow($tomorrow);
    }
}
