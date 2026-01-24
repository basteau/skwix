<?php

use App\Services\OpenRouterService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    RateLimiter::clear('openrouter-api');
});

test('returns error when api key not configured', function () {
    config(['services.openrouter.api_key' => '']);

    $service = new OpenRouterService;
    $result = $service->askQuestion('test', 'Is this a word?');

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('not configured');
});

test('successfully calls openrouter api and parses yes response', function () {
    config(['services.openrouter.api_key' => 'test-key']);

    Http::fake([
        'openrouter.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Yes, certainly!']],
            ],
        ], 200),
    ]);

    $service = new OpenRouterService;
    $result = $service->askQuestion('apple', 'Is it a fruit?');

    expect($result['success'])->toBeTrue();
    expect($result['answer'])->toBe('yes');
});

test('successfully parses no response', function () {
    config(['services.openrouter.api_key' => 'test-key']);

    Http::fake([
        'openrouter.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Nope, not at all.']],
            ],
        ], 200),
    ]);

    $service = new OpenRouterService;
    $result = $service->askQuestion('apple', 'Is it a vehicle?');

    expect($result['success'])->toBeTrue();
    expect($result['answer'])->toBe('no');
});

test('handles api error gracefully', function () {
    config(['services.openrouter.api_key' => 'test-key']);

    Http::fake([
        'openrouter.ai/*' => Http::response(['error' => 'Bad request'], 400),
    ]);

    $service = new OpenRouterService;
    $result = $service->askQuestion('apple', 'Is it a fruit?');

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('failed');
});

test('rate limits requests', function () {
    config(['services.openrouter.api_key' => 'test-key']);

    Http::fake([
        'openrouter.ai/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Yes']],
            ],
        ], 200),
    ]);

    $service = new OpenRouterService;

    for ($i = 0; $i < 20; $i++) {
        $service->askQuestion('apple', 'Question '.$i);
    }

    $result = $service->askQuestion('apple', 'One more question');

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('Rate limited');
});

test('sends correct system prompt with secret word', function () {
    config(['services.openrouter.api_key' => 'test-key']);

    Http::fake(function ($request) {
        $body = json_decode($request->body(), true);
        $systemMessage = $body['messages'][0]['content'];

        expect($systemMessage)->toContain('secret word is "banana"');
        expect($systemMessage)->toContain('yes/no questions');
        expect($systemMessage)->toContain('Never reveal');

        return Http::response([
            'choices' => [
                ['message' => ['content' => 'Yes']],
            ],
        ], 200);
    });

    $service = new OpenRouterService;
    $service->askQuestion('banana', 'Is it yellow?');
});
