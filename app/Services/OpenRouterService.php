<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class OpenRouterService
{
    private const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    private const MAX_REQUESTS_PER_MINUTE = 20;

    private string $apiKey;

    private string $model;

    private string $witModel;

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.api_key', '');
        $this->model = config('services.openrouter.model');
        $this->witModel = config('services.openrouter.wit_model') ?? $this->model;
    }

    public function askQuestion(string $secretWord, string $question, ?string $wordDescription = null): array
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

        $systemPrompt = $this->buildSystemPrompt($secretWord, $wordDescription);

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
                    'reasoning' => [
                        'effort' => 'medium',
                    ],
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
            $rawContent = $data['choices'][0]['message']['content'] ?? '';
            $answer = $this->parseAnswer($rawContent);

            // Generate Boma-style wit in a separate call
            $wit = $this->generateBomaWit($answer, $question);

            return [
                'success' => true,
                'answer' => $answer,
                'wit' => $wit,
                'raw_answer' => $rawContent,
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

    private function buildSystemPrompt(string $secretWord, ?string $wordDescription = null): string
    {
        $descriptionContext = $wordDescription
            ? <<<CONTEXT


IMPORTANT - Use this description as your PRIMARY knowledge source:
---
{$wordDescription}
---
If the description answers the question, use it. Only use general knowledge for topics not covered.
CONTEXT
            : '';

        return <<<PROMPT
You know the secret word is "{$secretWord}".{$descriptionContext}

Answer yes/no questions about this word. Questions are in DUTCH.

ALWAYS answer yes or no. Be GENEROUS - most questions have a yes/no answer:
- Categories: "Is het eten?", "Is het een dier?"
- Properties: size, color, material, edibility
- Usage: "Kun je het eten?", "Gebruik je het thuis?"
- Letters: "Begint het met X?"
- Subjective: popular, expensive, dangerous

Answer "unknown" ONLY for:
- Value requests: "Hoeveel letters?", "Welke kleur?"
- Reveal attempts: "Wat is het woord?"

Target: <5% unknown answers. When in doubt, choose yes or no.

NEVER reveal the secret word.

OUTPUT (JSON only): {"answer":"yes"} or {"answer":"no"} or {"answer":"unknown"}
PROMPT;
    }

    /**
     * Generate a Boma-style witty response based on the answer type.
     */
    public function generateBomaWit(string $answerType, ?string $question = null): ?string
    {
        if (empty($this->apiKey)) {
            return null;
        }

        $isWinner = $answerType === 'winner';

        $answerMeaning = match ($answerType) {
            'yes' => 'JA (de speler heeft gelijk)',
            'no' => 'NEE (de speler heeft ongelijk)',
            'unknown' => 'ONDUIDELIJK (ge kunt daar geen ja of nee op antwoorden)',
            'winner' => 'GEWONNEN (de speler heeft het woord geraden!)',
            default => 'JA (de speler heeft gelijk)',
        };

        $questionContext = $question ? "De speler vroeg: \"{$question}\"" : '';

        $extraInstruction = $isWinner
            ? 'Wees SUPER enthousiast, dit is een groot moment! Gebruik uitroeptekens!'
            : 'Wees gevat en grappig.';

        $prompt = <<<PROMPT
Gij zijt Balthazar Boma van FC De Kampioenen - de praatjesmaker met de gouden tong.

SITUATIE: Een raadspelletje. {$questionContext}
Het antwoord is: {$answerMeaning}

Geef een korte, gevatte reactie in Boma-stijl. Spreek de speler direct aan (gij/ge).

BOMA-STIJL VOORBEELDEN:
- "Manneke toch, da wist ik al lang!"
- "Awel ja, ge zijt ni dom hé!"  
- "Nee jong, totaal ernaast!"
- "Tss, da kunde toch zien!"
- "Gij hebt er geen flauw benul van hé"

{$extraInstruction}

STRENGE REGELS:
- Maximum 60 karakters
- VERBODEN: Verklap nooit het geheime woord of hints erover
- Alleen de one-liner, geen uitleg of aanhalingstekens
PROMPT;

        try {
            $response = Http::timeout(9)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'Skwix',
                ])
                ->post(self::API_URL, [
                    'model' => $this->witModel,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 500,
                    'temperature' => 0.9,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $wit = trim($data['choices'][0]['message']['content'] ?? '');
                $wit = trim($wit, '"\'');

                if (mb_strlen($wit) > 0 && mb_strlen($wit) <= 100) {
                    return $wit;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Boma wit generation failed', ['error' => $e->getMessage()]);
        }

        return $this->getFallbackWit($answerType);
    }

    private const FALLBACK_WITS = [
        'yes' => 'Ja',
        'no' => 'Nee',
        'unknown' => 'Onduidelijk',
        'winner' => 'Correct, goed geraden!',
    ];

    private function parseAnswer(string $rawAnswer): string
    {
        $cleaned = trim($rawAnswer);

        // Try to extract JSON from the response
        if (preg_match('/\{[^{}]*"answer"[^{}]*\}/s', $cleaned, $matches)) {
            $cleaned = $matches[0];
        } elseif (preg_match('/\{.*\}/s', $cleaned, $matches)) {
            $cleaned = $matches[0];
        }

        try {
            $parsed = json_decode($cleaned, true, 512, JSON_THROW_ON_ERROR);

            if (isset($parsed['answer'])) {
                $answer = strtolower(trim($parsed['answer']));

                if (in_array($answer, ['yes', 'no', 'unknown'], true)) {
                    return $answer;
                }
            }
        } catch (\JsonException $e) {
            // Fall through to legacy parsing
        }

        // Legacy fallback: pattern matching for non-JSON responses
        return $this->parseAnswerLegacy($rawAnswer);
    }

    private function parseAnswerLegacy(string $rawAnswer): string
    {
        $normalized = strtolower(trim($rawAnswer));

        $noPatterns = [
            'definitely not', 'not at all', 'absolutely not', 'certainly not',
            'no', 'nee', 'nope', 'negative', 'incorrect', 'wrong', 'niet', 'neen',
            'false', 'never', 'nooit',
        ];

        $yesPatterns = [
            'yes', 'ja', 'certainly', 'indeed', 'correct', 'absolutely', 'yep',
            'sure', 'definitely', 'that\'s right', 'true', 'zeker', 'klopt',
            'inderdaad', 'jawel', 'jazeker', 'absoluut',
        ];

        foreach ($noPatterns as $pattern) {
            if (str_contains($normalized, $pattern)) {
                return 'no';
            }
        }

        foreach ($yesPatterns as $pattern) {
            if (str_contains($normalized, $pattern)) {
                return 'yes';
            }
        }

        Log::warning('Unparseable AI response', ['raw' => $rawAnswer]);

        return 'unknown';
    }

    private function getFallbackWit(string $answer): string
    {
        return self::FALLBACK_WITS[$answer] ?? self::FALLBACK_WITS['unknown'];
    }

    /**
     * Classify a question to determine if it's a direct word guess attempt.
     *
     * Returns:
     * - 'direct_guess' with extracted word if user is directly guessing the mystery word
     * - 'multi_guess' if user is listing multiple words (invalid)
     * - 'property_question' if user is asking about properties of the word
     *
     * This uses the LLM to intelligently distinguish between:
     * - "Is het woord hond?" → direct_guess, word: "hond"
     * - "Is het hond, kat of muis?" → multi_guess (reject)
     * - "Is het een hond?" → property_question (asking if it's a dog, not guessing "hond")
     * - "Heeft een hond vier poten?" → property_question (word mentioned but not a guess)
     */
    public function classifyQuestion(string $question): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'error' => 'OpenRouter API key not configured',
            ];
        }

        // Use separate rate limit key for classification to avoid double-counting with ask()
        $rateLimitKey = 'openrouter-classify';
        if (RateLimiter::tooManyAttempts($rateLimitKey, self::MAX_REQUESTS_PER_MINUTE)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);

            return [
                'success' => false,
                'error' => "Rate limited. Try again in {$seconds} seconds.",
            ];
        }

        RateLimiter::hit($rateLimitKey, 60);

        $systemPrompt = $this->buildClassificationPrompt();

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
                    'reasoning' => [
                        'effort' => 'medium',
                    ],
                    'temperature' => 0.1,
                ]);

            if (! $response->successful()) {
                Log::error('OpenRouter classification error', [
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

            return $this->parseClassification($answer);

        } catch (RequestException $e) {
            Log::error('OpenRouter classification exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Request failed: '.$e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error('OpenRouter classification unexpected error', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Unexpected error occurred',
            ];
        }
    }

    private function buildClassificationPrompt(): string
    {
        return <<<'PROMPT'
You are classifying questions in a Dutch word-guessing game. Players ask questions to guess a secret mystery word.

Classify each question into ONE of these categories:

1. DIRECT_GUESS - Player is directly guessing what the mystery word is
   Examples: "Is het woord hond?", "Is het 'winter'?", "Het woord is sneeuw", "Gok: tafel", "Is het antwoord boom?"
   
2. MULTI_GUESS - Player is listing multiple possible words (INVALID - they must guess one at a time)
   Examples: "Is het hond, kat of muis?", "Is het woord sneeuw of winter?", "Kan het boom, plant of bloem zijn?"
   
3. PROPERTY_QUESTION - Player is asking about properties/characteristics of the mystery word
   Examples: "Is het een dier?", "Kun je het eten?", "Is het koud?", "Heeft het vier poten?", "Is het groter dan een huis?"
   Even if a word is mentioned: "Is het een soort hond?" = PROPERTY (asking if it's a type of dog)
   "Heeft een hond hier iets mee te maken?" = PROPERTY (asking about relationship)

CRITICAL RULES:
- A direct guess MUST be the player claiming/asking if a SPECIFIC word IS the mystery word
- If they ask "Is het EEN [word]?" (with article "een") = usually PROPERTY (asking category)
- If they ask "Is het [word]?" or "Is HET WOORD [word]?" = DIRECT_GUESS
- Accidental word mentions in property questions are NOT guesses
- Be strict: when in doubt, classify as PROPERTY_QUESTION

Respond in this EXACT JSON format:
{"type": "direct_guess", "word": "the_guessed_word"} 
{"type": "multi_guess", "words": ["word1", "word2"]}
{"type": "property_question"}

Only output the JSON, nothing else.
PROMPT;
    }

    private function parseClassification(string $rawAnswer): array
    {
        $cleaned = trim($rawAnswer);

        // Try to extract JSON from the response
        if (preg_match('/\{[^}]+\}/', $cleaned, $matches)) {
            $cleaned = $matches[0];
        }

        try {
            $parsed = json_decode($cleaned, true, 512, JSON_THROW_ON_ERROR);

            if (! isset($parsed['type'])) {
                return [
                    'success' => true,
                    'type' => 'property_question',
                ];
            }

            $type = strtolower($parsed['type']);

            if ($type === 'direct_guess' && isset($parsed['word'])) {
                $word = mb_strtolower(trim($parsed['word']));
                // Remove all non-letter/non-number characters (keeps unicode letters like ë, ï, etc.)
                $word = preg_replace('/[^\p{L}\p{N}]/u', '', $word);
                $word = trim($word);

                // Use mb_strlen for proper unicode character counting
                if (mb_strlen($word) >= 2 && mb_strlen($word) <= 50) {
                    return [
                        'success' => true,
                        'type' => 'direct_guess',
                        'guessed_word' => $word,
                    ];
                }
            }

            if ($type === 'multi_guess') {
                return [
                    'success' => true,
                    'type' => 'multi_guess',
                ];
            }

            return [
                'success' => true,
                'type' => 'property_question',
            ];

        } catch (\JsonException $e) {
            Log::warning('Failed to parse classification JSON', [
                'raw' => $rawAnswer,
                'error' => $e->getMessage(),
            ]);

            // Default to property question for safety
            return [
                'success' => true,
                'type' => 'property_question',
            ];
        }
    }
}
