<?php

return [
    /*
    |--------------------------------------------------------------------------
    | E2E Test Configuration
    |--------------------------------------------------------------------------
    */

    'base_url' => env('E2E_BASE_URL', 'http://127.0.0.1:8010'),

    'timeouts' => [
        'default' => 10000,
        'navigation' => 15000,
        'animation' => 5000,
    ],

    'viewport' => [
        'width' => 390,
        'height' => 844,
    ],

    /*
    |--------------------------------------------------------------------------
    | Data Test IDs Reference
    |--------------------------------------------------------------------------
    | Central reference for all data-testid selectors used in E2E tests.
    */

    'selectors' => [
        // Welcome Page
        'welcome' => [
            'invite_code_input' => 'invite-code-input',
            'join_game_button' => 'join-game-button',
            'code_error' => 'code-error',
        ],

        // Lobby Page
        'lobby' => [
            'countdown' => 'countdown',
            'player_list' => 'player-list',
            'player_card' => 'player-card', // + -{id}
        ],

        // Wordle Page
        'wordle' => [
            'grid' => 'wordle-grid',
            'tile' => 'wordle-tile', // + -r{row}-c{col}
            'key' => 'wordle-key', // + -{letter|enter|backspace}
            'message' => 'wordle-message',
            'points_header' => 'points-header',
        ],

        // Guess Page
        'guess' => [
            'input' => 'guess-input',
            'submit_button' => 'guess-submit-button',
            'history' => 'guess-history',
            'item' => 'guess-item', // + -{id}
            'points_display' => 'guess-points-display',
        ],

        // Fortune Page
        'fortune' => [
            'wager_input' => 'fortune-wager-input',
            'spin_button' => 'fortune-spin-button',
            'half_button' => 'fortune-half-button',
            'max_button' => 'fortune-max-button',
            'wheel' => 'fortune-wheel',
            'result' => 'fortune-result',
            'points_display' => 'fortune-points-display',
        ],

        // Players Page
        'players' => [
            'leaderboard' => 'leaderboard',
            'player_row' => 'player-row', // + -{id}
        ],

        // Win Page
        'win' => [
            'title' => 'win-title',
            'secret_word_reveal' => 'secret-word-reveal',
            'winner_name' => 'winner-name',
            'prize_display' => 'prize-display',
        ],

        // Lose Page
        'lose' => [
            'title' => 'lose-title',
            'winner_name' => 'winner-name',
            'secret_word_reveal' => 'secret-word-reveal',
        ],
    ],
];
