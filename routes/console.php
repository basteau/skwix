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
    ->everyMinute()
    ->timezone('Europe/Brussels')
    ->description('Wordle notification (runs every minute, fires at each game\'s configured hour)');

Schedule::command('game:end-expired')
    ->everyMinute()
    ->description('End games that have reached their end time');
