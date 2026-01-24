# Pest v4 Browser Testing (Laravel)

Pest v4 provides elegant browser testing with full Laravel integration—RefreshDatabase, fakes, assertions all work.

## Installation

```bash
composer require pestphp/pest-plugin-browser --dev
npm install playwright@latest
npx playwright install
```

Add to `.gitignore`:
```
tests/Browser/Screenshots
```

## Basic Test

```php
// tests/Browser/HomepageTest.php
it('shows welcome message', function () {
    visit('/')
        ->assertSee('Welcome');
});
```

## Laravel Integration

Full access to Laravel testing features:

```php
it('allows user to reset password', function () {
    Notification::fake();
    
    $user = User::factory()->create();
    
    visit('/forgot-password')
        ->type('email', $user->email)
        ->press('Send Reset Link')
        ->assertSee('We have emailed your password reset link!');
    
    Notification::assertSentTo($user, ResetPassword::class);
});
```

With RefreshDatabase (even SQLite in-memory):

```php
uses(RefreshDatabase::class);

it('creates a new post', function () {
    $this->actingAs(User::factory()->create());
    
    visit('/posts/create')
        ->type('title', 'My Post')
        ->type('body', 'Content here')
        ->press('Publish')
        ->assertSee('Post created!');
    
    $this->assertDatabaseHas('posts', ['title' => 'My Post']);
});
```

## Navigation

```php
visit('/login')                    // Visit URL
    ->navigate('/dashboard')       // Navigate (keeps context)
    ->assertUrlIs('/dashboard');

// Multiple pages at once
visit(['/', '/about', '/contact'])
    ->assertNoSmoke();             // No JS errors on any page
```

## Device & Mode

```php
visit('/responsive-page')
    ->onMobile()                   // Mobile viewport
    ->inDarkMode()                 // Dark color scheme
    ->assertSee('Mobile Menu');

// Specific devices
visit('/app')
    ->on()->iPhone14Pro()
    ->assertSee('App');

visit('/app')
    ->on()->macbook14()
    ->assertSee('Desktop');
```

## Interactions

```php
visit('/form')
    ->type('email', 'user@example.com')     // Type in field
    ->typeSlowly('search', 'query')         // Type like human
    ->append('notes', ' more text')         // Append without clearing
    ->select('country', 'US')               // Select dropdown
    ->check('terms')                        // Check checkbox
    ->uncheck('newsletter')                 // Uncheck
    ->radio('plan', 'premium')              // Select radio
    ->attach('avatar', '/path/to/file.jpg') // Upload file
    ->press('Submit')                       // Click button
    ->click('Learn More');                  // Click link
```

## Locators

```php
// By text content
->click('Sign In')
->type('Email', 'test@example.com')

// By CSS selector
->click('#submit-btn')
->type('input[name="email"]', 'test@example.com')

// By label (forms)
->type('Email Address', 'test@example.com')
```

## Assertions

### Content
```php
->assertSee('Welcome')
->assertDontSee('Error')
->assertSeeIn('.header', 'Logo')
->assertDontSeeIn('.sidebar', 'Admin')
->assertSeeAnythingIn('.content')
->assertSeeNothingIn('.empty-state')
```

### Page
```php
->assertTitle('My App')
->assertTitleContains('App')
->assertUrlIs('/dashboard')
->assertSourceHas('<meta name="robots"')
->assertSourceMissing('debug-info')
```

### Links
```php
->assertSeeLink('Documentation')
->assertDontSeeLink('Admin Panel')
```

### Form State
```php
->assertChecked('remember')
->assertNotChecked('terms')
->assertSelected('country', 'US')
->assertNotSelected('country', 'UK')
->assertValue('email', 'user@example.com')
->assertInputValue('search', '')
```

### Elements
```php
->assertVisible('.modal')
->assertMissing('.loader')
->assertEnabled('#submit')
->assertDisabled('#submit')
->assertFocused('input[name="email"]')
->assertNotFocused('input[name="password"]')
->assertCount('.item', 5)
```

### JavaScript
```php
->assertScript('window.appLoaded', true)
->assertNoJavascriptErrors()
->assertNoConsoleLogs()
->assertNoSmoke()    // Shorthand for both above
```

## Getting Values

```php
$text = visit('/page')->text('.headline');
$value = visit('/form')->value('#email');
$attr = visit('/link')->attribute('a.primary', 'href');
$url = visit('/page')->url();
$content = visit('/page')->content();
```

## Debugging

```php
// Screenshot
visit('/page')
    ->screenshot()                    // Auto-named
    ->screenshot('custom-name.png');  // Custom name

// Screenshot element
visit('/page')
    ->screenshotElement('.chart', 'chart.png');

// Pause and open browser
visit('/page')
    ->debug();

// Open tinker in page context
visit('/page')
    ->tinker();
```

## Running Tests

```bash
# Standard run
./vendor/bin/pest

# Parallel (recommended)
./vendor/bin/pest --parallel

# Headed mode (see browser)
./vendor/bin/pest --headed

# Debug mode (pause on failure)
./vendor/bin/pest --debug

# Specific browser
./vendor/bin/pest --browser=firefox

# Sharding for CI
./vendor/bin/pest --shard=1/4 --parallel
```

## Configuration (Pest.php)

```php
uses()->beforeEach(function () {
    // Runs before each browser test
})->in('Browser');

// Default browser
pest()->browser('firefox');

// Default headed mode
pest()->headed();

// Default timeout (seconds)
pest()->timeout(10);

// Default host (for subdomains)
pest()->host('app.test');

// Default user agent
pest()->userAgent('MyApp/1.0');
```

## CI (GitHub Actions)

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run Browser Tests
  run: ./vendor/bin/pest --parallel
```

## Smoke Testing

Quick way to verify all pages load without errors:

```php
it('all pages load without errors', function () {
    $routes = ['/', '/about', '/contact', '/pricing'];
    
    visit($routes)->assertNoSmoke();
});
```

## Visual Regression

```php
it('homepage looks correct', function () {
    visit('/')
        ->assertScreenshotMatches();  // Compares to baseline
});
```

## Iframes

```php
visit('/page-with-iframe')
    ->withinIframe('#my-iframe', function ($page) {
        $page->type('email', 'test@example.com')
             ->press('Submit');
    });
```
