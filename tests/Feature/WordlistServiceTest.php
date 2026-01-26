<?php

use App\Services\WordlistService;

test('wordlist has at least 2048 words', function () {
    $service = new WordlistService;

    expect($service->count())->toBeGreaterThanOrEqual(2048);
});

test('all words are exactly 5 letters', function () {
    $service = new WordlistService;
    $words = $service->getWords();

    $words->each(function ($word) {
        expect(mb_strlen($word))->toBe(5);
    });
});

test('all words are unique', function () {
    $service = new WordlistService;
    $words = $service->getWords();

    expect($words->unique()->count())->toBe($words->count());
});

test('all words have no special characters', function () {
    $service = new WordlistService;
    $words = $service->getWords();

    $words->each(function ($word) {
        expect($word)->toMatch('/^[a-z]{5}$/');
    });
});

test('can get random words', function () {
    $service = new WordlistService;
    $words = $service->getRandomWords(10);

    expect($words)->toHaveCount(10);
    foreach ($words as $word) {
        expect(mb_strlen($word))->toBe(5);
    }
});

test('can validate words', function () {
    $service = new WordlistService;

    expect($service->isValidWord('apple'))->toBeTrue();
    expect($service->isValidWord('xxxxx'))->toBeFalse();
});
