---
name: laravel-boost
description: Laravel development guidance with Context7 docs. Triggers on Laravel development, debugging, or database tasks.
references:
  - references/inertia.md
  - references/wayfinder.md
  - references/pest.md
  - references/php-conventions.md
---

# Laravel Boost

Laravel development guidance with Context7 documentation lookup.

## Stack
- PHP 8.5, Laravel 12, Inertia v2, Fortify v1
- Wayfinder, Pint v1, Pest v4, Sail v1

## Documentation Lookup (Context7)

**Always search docs before implementing Laravel features.**

Use `mcp__context7__query-docs` with pre-resolved library IDs:

| Library | ID |
|---------|-----|
| Laravel | `/laravel/framework` |
| Fortify | `/laravel/fortify` |
| Sanctum | `/laravel/sanctum` |
| Inertia | `/inertiajs/inertia` |
| Pest | `/pestphp/pest` |
| Livewire | `/livewire/livewire` |

Example:
```
query-docs(libraryId: "/laravel/framework", query: "rate limiting middleware")
```

For unknown libraries, first use `mcp__context7__resolve-library-id` to find the ID.

## Laravel 12 Structure
- Middleware: `bootstrap/app.php` with `->withMiddleware()`
- Providers: `bootstrap/providers.php`
- Console: `routes/console.php` (auto-registered commands)
- No `app/Http/Kernel.php` or `app/Console/Kernel.php`

## Database
- Use Eloquent over `DB::` facade
- Eager load to prevent N+1
- Migrations must include ALL column attributes when modifying
- Casts in `casts()` method, not `$casts` property

## Controllers
- Form Request classes for validation (not inline)
- `--no-interaction` on all artisan commands
- Use `php artisan make:` commands for new files

## Testing
Every change needs tests. Run minimal tests with filters:
```bash
php artisan test --compact --filter=testName
```

## Code Style
Run before finalizing:
```bash
vendor/bin/pint --dirty
```

## Frontend
If changes don't reflect: `npm run build` or `npm run dev`

## Advanced Topics
- **Inertia v2**: See [references/inertia.md](references/inertia.md)
- **Wayfinder**: See [references/wayfinder.md](references/wayfinder.md)
- **Pest v4**: See [references/pest.md](references/pest.md)
- **PHP conventions**: See [references/php-conventions.md](references/php-conventions.md)
