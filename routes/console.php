<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('game:activate-pending')
    ->everyMinute()
    ->description('Activate games that have reached their start time');

Schedule::command('game:notify-wordle')
    ->dailyAt('08:00')
    ->timezone('Europe/Amsterdam')
    ->description('Daily Wordle notification at 8:00 AM CET');
