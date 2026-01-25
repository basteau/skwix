<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Driver
    |--------------------------------------------------------------------------
    |
    | The driver to use for AI responses. Use 'fake' for deterministic E2E tests.
    | Options: 'openrouter', 'fake'
    |
    */
    'ai_driver' => env('AI_DRIVER', 'openrouter'),

    /*
    |--------------------------------------------------------------------------
    | AI Sequence (for fake driver)
    |--------------------------------------------------------------------------
    |
    | Comma-separated sequence of yes/no responses for the fake AI driver.
    |
    */
    'ai_sequence' => env('E2E_AI_SEQUENCE', 'yes,no'),

    /*
    |--------------------------------------------------------------------------
    | Fortune Driver
    |--------------------------------------------------------------------------
    |
    | The driver to use for wheel of fortune outcomes. Use 'fake' for deterministic E2E tests.
    | Options: 'random', 'fake'
    |
    */
    'fortune_driver' => env('FORTUNE_DRIVER', 'random'),

    /*
    |--------------------------------------------------------------------------
    | Fortune Sequence (for fake driver)
    |--------------------------------------------------------------------------
    |
    | Comma-separated sequence of win/lose outcomes for the fake fortune driver.
    |
    */
    'fortune_sequence' => env('E2E_FORTUNE_SEQUENCE', 'win,lose'),

];
