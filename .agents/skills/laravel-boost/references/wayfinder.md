# Wayfinder Reference

Generates TypeScript functions for Laravel routes with type safety.

## Usage
```typescript
import { show, store } from '@/actions/App/Http/Controllers/PostController'

show(1)           // { url: "/posts/1", method: "get" }
show.url(1)       // "/posts/1"
show.get(1)       // { url: "/posts/1", method: "get" }
```

## Named Routes
```typescript
import { show as postShow } from '@/routes/post'
postShow(1)       // { url: "/posts/1", method: "get" }
```

## With Inertia useForm
```typescript
import { store } from "@/actions/App/Http/Controllers/ExampleController";
const form = useForm({ name: "My Post" });
form.submit(store());
```

## Guidelines
- Use named imports for tree-shaking
- Avoid default controller imports
- Run `php artisan wayfinder:generate` after route changes
- Use `search-docs` for detailed docs

## Features
- `.form()` for HTML form attributes
- `.get()`, `.post()`, `.patch()`, `.put()`, `.delete()` methods
- Parameter binding with route keys
- Query params: `show(1, { query: { page: 1 } })`
- Query merging: `show(1, { mergeQuery: { page: 2, sort: null } })`
