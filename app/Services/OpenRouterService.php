<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class OpenRouterService
{
    private const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    private const DEFAULT_MODEL = 'openai/gpt-5-mini';

    private const MAX_REQUESTS_PER_MINUTE = 20;

    private string $apiKey;

    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.api_key', '');
        $this->model = config('services.openrouter.model', self::DEFAULT_MODEL);
    }

    public function askQuestion(string $secretWord, string $question): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'error' => 'OpenRouter API key not configured',
            ];
        }

        $rateLimitKey = 'openrouter-api';
        if (RateLimiter::tooManyAttempts($rateLimitKey, self::MAX_REQUESTS_PER_MINUTE)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);

            return [
                'success' => false,
                'error' => "Rate limited. Try again in {$seconds} seconds.",
            ];
        }

        RateLimiter::hit($rateLimitKey, 60);

        $systemPrompt = $this->buildSystemPrompt($secretWord);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'Skwix',
                ])
                ->post(self::API_URL, [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $question],
                    ],
                    'max_tokens' => 50,
                    'temperature' => 0.3,
                ]);

            if (! $response->successful()) {
                Log::error('OpenRouter API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'API request failed',
                ];
            }

            $data = $response->json();
            $answer = $data['choices'][0]['message']['content'] ?? '';

            return [
                'success' => true,
                'answer' => $this->parseAnswer($answer),
                'raw_answer' => $answer,
            ];

        } catch (RequestException $e) {
            Log::error('OpenRouter request exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Request failed: '.$e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('OpenRouter unexpected error', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Unexpected error occurred',
            ];
        }
    }

    private function buildSystemPrompt(string $secretWord): string
    {
        return <<<PROMPT
You know the secret word is "{$secretWord}".
Answer yes/no questions about it.
Never reveal the word or give extra information.
Only respond with variations of yes or no (e.g., "Yes", "No", "Certainly", "Nope", "Indeed", "Not at all").
Keep responses under 5 words.
PROMPT;
    }

    private function parseAnswer(string $rawAnswer): string
    {
        $normalized = strtolower(trim($rawAnswer));

        $yesPatterns = ['yes', 'ja', 'certainly', 'indeed', 'correct', 'absolutely', 'yep', 'sure', 'definitely', 'that\'s right'];
        $noPatterns = ['no', 'nee', 'nope', 'not', 'negative', 'incorrect', 'wrong', 'definitely not', 'not at all'];

        foreach ($yesPatterns as $pattern) {
            if (str_contains($normalized, $pattern)) {
                return 'yes';
            }
        }

        foreach ($noPatterns as $pattern) {
            if (str_contains($normalized, $pattern)) {
                return 'no';
            }
        }

        return 'yes';
    }
}
