<?php

namespace App\Services;

use Illuminate\Support\Facades\Session;

class TestGameService
{
    private const SESSION_KEY = 'test_game';

    public function isTestMode(): bool
    {
        return Session::has(self::SESSION_KEY);
    }

    public function getTestGame(): ?array
    {
        return Session::get(self::SESSION_KEY);
    }

    public function startTestGame(): array
    {
        $wordlist = app(WordlistService::class);
        $secretWord = $wordlist->getRandomWords(1)[0] ?? 'winter';
        $wordleWords = $wordlist->getRandomWords(5);

        $testGame = [
            'id' => 999999,
            'secret_word' => $secretWord,
            'wordle_words' => $wordleWords,
            'status' => 'active',
            'starts_at' => now()->subHour()->toISOString(),
            'ends_at' => now()->addDays(5)->toISOString(),
            'player' => [
                'id' => 999999,
                'name' => 'Test Speler',
                'email' => 'test@skwix.test',
                'points' => 100,
                'avatar_url' => null,
            ],
            'wordle' => [
                'guesses' => [],
                'completed' => false,
                'points_earned' => 0,
            ],
            'questions' => [],
            'spins' => [],
            'fake_players' => $this->generateFakePlayers(),
        ];

        Session::put(self::SESSION_KEY, $testGame);

        return $testGame;
    }

    public function updateTestGame(array $updates): array
    {
        $testGame = $this->getTestGame();
        if (! $testGame) {
            return $this->startTestGame();
        }

        $testGame = array_replace_recursive($testGame, $updates);
        Session::put(self::SESSION_KEY, $testGame);

        return $testGame;
    }

    public function resetTestGame(): array
    {
        $this->exitTestMode();

        return $this->startTestGame();
    }

    public function exitTestMode(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    public function getTestPlayer(): ?array
    {
        return $this->getTestGame()['player'] ?? null;
    }

    public function getWordleWord(int $dayNumber): ?string
    {
        $testGame = $this->getTestGame();
        $index = max(0, min($dayNumber - 1, count($testGame['wordle_words'] ?? []) - 1));

        return $testGame['wordle_words'][$index] ?? null;
    }

    public function getDayNumber(): int
    {
        return 1;
    }

    public function getAllPlayers(): array
    {
        $testGame = $this->getTestGame();
        if (! $testGame) {
            return [];
        }

        $players = array_merge(
            [$testGame['player']],
            $testGame['fake_players'] ?? []
        );

        usort($players, fn ($a, $b) => $b['points'] <=> $a['points']);

        return $players;
    }

    private function generateFakePlayers(): array
    {
        $names = ['Emma', 'Liam', 'Sophie', 'Noah', 'Julia', 'Lucas'];
        shuffle($names);

        $players = [];
        for ($i = 0; $i < 4; $i++) {
            $players[] = [
                'id' => 999900 + $i,
                'name' => $names[$i],
                'email' => strtolower($names[$i]).'@test.local',
                'points' => 80 - ($i * 15) + rand(-5, 10),
                'avatar_url' => null,
            ];
        }

        return $players;
    }
}
