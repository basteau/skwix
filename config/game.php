<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Guess Cost
    |--------------------------------------------------------------------------
    |
    | The number of points required to ask a question or make a direct guess.
    | This is the base unit for the game economy.
    |
    */
    'guess_cost' => 10,

    /*
    |--------------------------------------------------------------------------
    | Wordle Rewards
    |--------------------------------------------------------------------------
    |
    | Points earned for completing wordle based on number of guesses.
    | Designed as multipliers of guess_cost:
    | - 1 guess: 2.0x = 20 points
    | - 2 guesses: 1.7x = 17 points
    | - 3 guesses: 1.5x = 15 points
    | - 4 guesses: 1.4x = 14 points
    | - 5 guesses: 1.2x = 12 points
    | - 6 guesses: 1.0x = 10 points
    | - Failed (word not found): 0.7x = 7 points
    |
    */
    'wordle_rewards' => [
        1 => 20,
        2 => 17,
        3 => 15,
        4 => 14,
        5 => 12,
        6 => 10,
        'failed' => 7,
    ],

    /*
    |--------------------------------------------------------------------------
    | Sabotage Costs
    |--------------------------------------------------------------------------
    |
    | Points required for sabotage-related actions:
    | - sabotage_cost: Cost to sabotage another player's next question
    | - reveal_cost: Cost to reveal which of your questions were sabotaged
    |
    */
    'sabotage_cost' => 8,
    'reveal_cost' => 10,
];
