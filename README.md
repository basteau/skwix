# Skwix 🎿

Family Christmas game with Wordle, AI guessing, and wheel of fortune.

## Quick Start

```bash
composer setup    # Install deps, create .env, migrate, build assets
composer dev      # Start server + queue + logs + vite
```

Open http://localhost:8000

**Admin access:** set a unique `ADMIN_SECRET_TOKEN` in your local `.env`, then visit `/sudo/<your-token>`. Generate a token with `openssl rand -hex 32`. Never deploy with the E2E test token.

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

This public repository has GitHub Actions disabled and no deployment configured. To deploy your own instance, configure a separate [Laravel Cloud](https://cloud.laravel.com) application with fresh secrets.

Configure in your Laravel Cloud dashboard:
- Environment variables (see `.env.example`)
- Database (Postgres)
- Queue workers

## Public-source edition

Personal photos have been replaced with generated, metadata-free placeholders. Demo players use generic names and anonymized addresses. Cookies, runtime databases, activity exports, screenshots, and private planning notes have been removed from the entire published history.

The tracked `.env.example` and `.env.e2e` files are templates only. Generate a fresh application key with `php artisan key:generate`; use unique production credentials. See [SECURITY.md](SECURITY.md).

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
