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
        $this->assertGreaterThan(3000, count($this->words), 'Word list should have at least 3000 words');
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

    public function test_common_dutch_five_letter_words_are_included(): void
    {
        // Only test 5-letter common Dutch words
        $commonFiveLetterWords = [
            'hallo', 'water', 'brood', 'tafel', 'stoel', 'klein', 'blauw',
            'groen', 'zwart', 'lopen', 'staan', 'horen', 'komen', 'geven',
            'maken', 'nemen', 'zegge', 'weten', 'denkt', 'vraag', 'thuis',
            'later', 'geval', 'sinds', 'welke', 'eigen', 'grote', 'eerste',
        ];

        // Filter to only 5-letter words (in case any slipped through)
        $commonFiveLetterWords = array_filter($commonFiveLetterWords, fn ($w) => mb_strlen($w) === 5);

        $missingWords = array_filter($commonFiveLetterWords, fn ($w) => ! in_array($w, $this->words));

        // Allow some flexibility - at least 60% of common words should be present
        $threshold = count($commonFiveLetterWords) * 0.6;
        $present = count($commonFiveLetterWords) - count($missingWords);

        $this->assertGreaterThanOrEqual(
            $threshold,
            $present,
            'Most common Dutch 5-letter words should be included. Missing: '.implode(', ', $missingWords)
        );
    }

    public function test_no_obvious_english_only_words(): void
    {
        $englishOnlyWords = [
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
            'had', 'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how',
            'its', 'let', 'may', 'new', 'now', 'old', 'see', 'two', 'way',
            'who', 'boy', 'did', 'get', 'put', 'say', 'she', 'too', 'use',
        ];

        $foundEnglish = array_filter($englishOnlyWords, fn ($w) => in_array($w, $this->words));

        // Allow some overlap (some words are valid in both languages)
        $this->assertLessThan(
            5,
            count($foundEnglish),
            'Too many English-only words found: '.implode(', ', $foundEnglish)
        );
    }

    public function test_wordlist_contains_reasonable_number_of_words(): void
    {
        // For a good Wordle game, we need a substantial list
        // Original Dutch Wordle (woordle.nl) uses ~3000+ words
        $this->assertGreaterThan(
            3000,
            count($this->words),
            'Word list should have at least 3000 words for good game variety'
        );

        // But not too many obscure words
        $this->assertLessThan(
            15000,
            count($this->words),
            'Word list should not exceed 15000 words to maintain quality'
        );
    }
}
