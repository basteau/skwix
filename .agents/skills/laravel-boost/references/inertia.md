# Inertia v2 Reference

Components go in `resources/js/Pages` (check `vite.config.js` for overrides).

## Rendering
```php
Route::get('/users', fn() => Inertia::render('Users/Index', ['users' => User::all()]));
```

## v2 Features
- Deferred props
- Infinite scrolling with merging props + `WhenVisible`
- Lazy loading on scroll
- Polling
- Prefetching

## Deferred Props
Add pulsing/animated skeleton for empty states when using deferred props.

## Forms
Use `useForm` helper. Query `search-docs` with `useForm helper` for examples.
