# PHP Conventions

## Control Structures
Always use curly braces, even for single lines.

## Constructors
Use PHP 8 property promotion:
```php
public function __construct(public GitHub $github) { }
```
No empty constructors unless private.

## Type Declarations
Always use explicit return types and parameter hints:
```php
protected function isAccessible(User $user, ?string $path = null): bool
{
    // ...
}
```

## Comments
Prefer PHPDoc blocks over inline comments. No comments in code unless complex.

## PHPDoc
Add array shape definitions when appropriate.

## Enums
Use TitleCase keys: `FavoritePerson`, `BestLake`, `Monthly`.
