# Pest v4 Reference

## Creating Tests
```bash
php artisan make:test --pest FeatureName
php artisan make:test --pest --unit UnitName
```

## Running Tests
```bash
php artisan test --compact                              # all tests
php artisan test --compact tests/Feature/MyTest.php    # single file
php artisan test --compact --filter=testName           # by name
```

## Basic Test
```php
it('works', function () {
    expect(true)->toBeTrue();
});
```

## HTTP Assertions
```php
it('returns data', function () {
    $this->postJson('/api/docs', [])->assertSuccessful();
});
```
Use `assertForbidden()`, `assertNotFound()` instead of `assertStatus(403)`.

## Mocking
```php
use function Pest\Laravel\mock;
mock(Service::class)->shouldReceive('method')->andReturn('value');
```

## Datasets
```php
it('validates emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    'james' => 'james@laravel.com',
    'taylor' => 'taylor@laravel.com',
]);
```

## Pest 4 Browser Testing
Browser tests go in `tests/Browser/`.

```php
it('logs in', function () {
    $page = visit('/login');
    $page->assertSee('Sign In')
        ->assertNoJavascriptErrors()
        ->fill('email', 'user@example.com')
        ->click('Submit');
});
```

Supports: multi-browser, viewports, dark mode, screenshots.
