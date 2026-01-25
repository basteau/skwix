# Skwix 🎿

Family Christmas game with Wordle, AI guessing, and wheel of fortune.

## Quick Start

```bash
composer setup    # Install deps, create .env, migrate, build assets
composer dev      # Start server + queue + logs + vite
```

Open http://localhost:8000

**Admin access:** `/sudo/local-test-admin-token`

## Commands

| Command | Description |
|---------|-------------|
| `composer setup` | First-time setup |
| `composer dev` | Start all dev services |
| `composer test` | Run tests + lint |
| `composer lint` | Fix code style |
| `composer test:e2e` | Run E2E browser tests |

## Database

SQLite by default (no setup needed).

```bash
php artisan migrate        # Run migrations
php artisan migrate:fresh  # Reset DB
php artisan db:seed        # Seed test data
```

## Deployment

Auto-deploys to [Laravel Cloud](https://cloud.laravel.com) on push to `main`.

Configure in Laravel Cloud dashboard:
- Environment variables (see `.env.example`)
- Database (Postgres)
- Queue workers

## Stack

- **Backend:** Laravel 12, PHP 8.4
- **Frontend:** React 19, Inertia v2, Tailwind 4
- **Database:** SQLite (dev), Postgres (prod)
- **AI:** OpenRouter (GPT-5)
- **Email:** Resend

## Docs

- [SPEC.md](docs/SPEC.md) - Full game specification
- [Laravel Cloud Guide](docs/laravel-cloud.md) - Deployment details
- [E2E Architecture](docs/testing/e2e-architecture.md) - Browser testing
