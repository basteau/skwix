<?php

namespace Tests\E2E\Support;

/**
 * Helper class for Playwright MCP browser interactions.
 *
 * This class wraps Playwright MCP commands for browser automation.
 * Use with playwriter skill for actual browser control.
 */
class PlaywrightHelper
{
    private string $baseUrl;

    private int $timeout;

    public function __construct(?string $baseUrl = null, int $timeout = 10000)
    {
        $this->baseUrl = $baseUrl ?? config('e2e.base_url', 'http://127.0.0.1:8010');
        $this->timeout = $timeout;
    }

    /**
     * Navigate to a URL (relative to base URL).
     */
    public function navigate(string $path): void
    {
        $url = $this->baseUrl.'/'.ltrim($path, '/');
        // Playwright MCP: browser_navigate(url)
        // This is a placeholder - actual implementation uses Playwright MCP
    }

    /**
     * Fill an input field by data-testid.
     */
    public function fill(string $testId, string $value): void
    {
        $selector = "[data-testid=\"{$testId}\"]";
        // Playwright MCP: browser_type(selector, text)
    }

    /**
     * Click an element by data-testid.
     */
    public function click(string $testId): void
    {
        $selector = "[data-testid=\"{$testId}\"]";
        // Playwright MCP: browser_click(selector)
    }

    /**
     * Wait for an element to be visible by data-testid.
     */
    public function waitFor(string $testId, int $timeout = null): void
    {
        $selector = "[data-testid=\"{$testId}\"]";
        $timeout = $timeout ?? $this->timeout;
        // Playwright MCP: browser_wait_for(selector, timeout)
    }

    /**
     * Get text content of an element by data-testid.
     */
    public function getText(string $testId): string
    {
        $selector = "[data-testid=\"{$testId}\"]";
        // Playwright MCP: browser_get_text(selector)
        return '';
    }

    /**
     * Check if an element exists by data-testid.
     */
    public function exists(string $testId): bool
    {
        $selector = "[data-testid=\"{$testId}\"]";
        // Playwright MCP: browser_element_exists(selector)
        return false;
    }

    /**
     * Take a screenshot.
     */
    public function screenshot(string $filename): void
    {
        // Playwright MCP: browser_screenshot(filename)
    }

    /**
     * Wait for URL to match a pattern.
     */
    public function waitForUrl(string $pattern): void
    {
        // Playwright MCP: browser_wait_for_url(pattern)
    }

    /**
     * Press keyboard keys (for Wordle).
     */
    public function pressKey(string $key): void
    {
        // Playwright MCP: browser_press(key)
    }

    /**
     * Get current URL.
     */
    public function getCurrentUrl(): string
    {
        // Playwright MCP: browser_get_url()
        return '';
    }
}
