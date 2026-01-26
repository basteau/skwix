<?php

namespace Tests\Unit;

use Tests\TestCase;

class WordlistValidationTest extends TestCase
{
    private array $words = [];

    protected function setUp(): void
    {
        parent::setUp();

        $path = public_path('woordenlijst.txt');
        if (file_exists($path)) {
            $content = file_get_contents($path);
            $this->words = array_values(array_filter(
                array_map('trim', explode("\n", $content)),
                fn ($word) => $word !== ''
            ));
        }
    }

    public function test_wordlist_is_not_empty(): void
    {
        $this->assertNotEmpty($this->words, 'Word list should not be empty');
        $this->assertGreaterThan(2000, count($this->words), 'Word list should have at least 2000 words');
    }

    public function test_all_words_are_exactly_five_letters(): void
    {
        $invalidWords = [];
        foreach ($this->words as $word) {
            if (mb_strlen($word) !== 5) {
                $invalidWords[] = $word;
            }
        }

        $this->assertEmpty(
            $invalidWords,
            'All words must be exactly 5 letters. Invalid: '.implode(', ', array_slice($invalidWords, 0, 10))
        );
    }

    public function test_all_words_are_lowercase(): void
    {
        $uppercaseWords = [];
        foreach ($this->words as $word) {
            if ($word !== mb_strtolower($word)) {
                $uppercaseWords[] = $word;
            }
        }

        $this->assertEmpty(
            $uppercaseWords,
            'All words must be lowercase. Found: '.implode(', ', array_slice($uppercaseWords, 0, 10))
        );
    }

    public function test_no_duplicate_words(): void
    {
        $unique = array_unique($this->words);
        $duplicates = array_diff_assoc($this->words, $unique);

        $this->assertEmpty(
            $duplicates,
            'No duplicate words allowed. Found: '.implode(', ', array_slice($duplicates, 0, 10))
        );
    }

    public function test_words_are_sorted_alphabetically(): void
    {
        $sorted = $this->words;
        sort($sorted);

        $this->assertEquals(
            $sorted,
            $this->words,
            'Words should be sorted alphabetically'
        );
    }

    public function test_common_english_five_letter_words_are_included(): void
    {
        // Common English 5-letter words from official Wordle
        $commonFiveLetterWords = [
            'about', 'above', 'after', 'again', 'apple', 'beach', 'bread',
            'bring', 'chair', 'child', 'clean', 'close', 'could', 'dance',
            'dream', 'drink', 'drive', 'earth', 'every', 'first', 'found',
            'fruit', 'great', 'green', 'happy', 'heart', 'house', 'large',
        ];

        $missingWords = array_filter($commonFiveLetterWords, fn ($w) => ! in_array($w, $this->words));

        // Allow some flexibility - at least 60% of common words should be present
        $threshold = count($commonFiveLetterWords) * 0.6;
        $present = count($commonFiveLetterWords) - count($missingWords);

        $this->assertGreaterThanOrEqual(
            $threshold,
            $present,
            'Most common English 5-letter words should be included. Missing: '.implode(', ', $missingWords)
        );
    }

    public function test_words_contain_only_ascii_letters(): void
    {
        $nonAscii = [];
        foreach ($this->words as $word) {
            if (! preg_match('/^[a-z]+$/', $word)) {
                $nonAscii[] = $word;
            }
        }

        $this->assertEmpty(
            $nonAscii,
            'Words should only contain ASCII letters. Found: '.implode(', ', array_slice($nonAscii, 0, 10))
        );
    }

    public function test_wordlist_contains_reasonable_number_of_words(): void
    {
        // Official Wordle uses ~2300 answer words
        $this->assertGreaterThan(
            2000,
            count($this->words),
            'Word list should have at least 2000 words for good game variety'
        );

        // But not too many obscure words
        $this->assertLessThan(
            5000,
            count($this->words),
            'Word list should not exceed 5000 words to maintain quality'
        );
    }
}
