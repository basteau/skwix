<?php

use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;

return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'code',
    'email' => 'email',
    'lowercase_usernames' => true,
    'home' => '/play/wordle',
    'prefix' => '',
    'domain' => null,
    'middleware' => ['web'],
    'limiters' => [
        'login' => 'login',
    ],
    'views' => true,
    'features' => [],
    'pipelines' => [
        'login' => [
            CanonicalizeUsername::class,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
        ],
    ],
];
