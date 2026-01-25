# Laravel Cloud Deployment Guide

Complete guide for deploying Skwix to Laravel Cloud with custom domain `skwix.example`.

## Table of Contents

- [Environment Variables Reference](#environment-variables-reference)
- [Domain Configuration](#domain-configuration-for-sebdevbe)
- [Resend Email Setup](#resend-email-setup)
- [Laravel Cloud Setup](#laravel-cloud-setup)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Environment Variables Reference

### Application Core

| Variable | Purpose | Production Value |
|----------|---------|------------------|
| `APP_NAME` | Display name | `Skwix` |
| `APP_ENV` | Environment mode | `production` |
| `APP_KEY` | Encryption key (32 chars base64) | `base64:xxxxxxxx...` |
| `APP_DEBUG` | Show detailed errors | `false` ⚠️ MUST be false |
| `APP_URL` | Canonical URL | `https://skwix.example` |
| `APP_TIMEZONE` | Server timezone | `Europe/Brussels` |
| `APP_LOCALE` | Default language | `en` |
| `BCRYPT_ROUNDS` | Password hashing cost | `12` |

### Database

Laravel Cloud auto-injects these when you provision Postgres:

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DB_CONNECTION` | Database driver | `pgsql` (auto) |
| `DB_HOST` | Managed host | Auto-injected |
| `DB_PORT` | Database port | `5432` (auto) |
| `DB_DATABASE` | Database name | Auto-injected |
| `DB_USERNAME` | Database user | Auto-injected |
| `DB_PASSWORD` | Database password | Auto-injected |

> **Note**: Do NOT manually set these. Laravel Cloud manages them automatically.

### Session, Cache & Queue

Using database driver (works without Redis):

| Variable | Purpose | Value |
|----------|---------|-------|
| `SESSION_DRIVER` | Session storage | `database` |
| `SESSION_LIFETIME` | Duration (minutes) | `120` |
| `SESSION_DOMAIN` | Cookie domain | `.sebdev.be` |
| `CACHE_STORE` | Cache backend | `database` |
| `QUEUE_CONNECTION` | Job backend | `database` |

**If using Redis** (optional, faster):

| Variable | Purpose | Notes |
|----------|---------|-------|
| `REDIS_HOST` | Redis host | Auto-injected if provisioned |
| `REDIS_PASSWORD` | Redis password | Auto-injected |
| `REDIS_PORT` | Redis port | `6379` (auto) |
| `SESSION_DRIVER` | Session storage | `redis` |
| `CACHE_STORE` | Cache backend | `redis` |
| `QUEUE_CONNECTION` | Job backend | `redis` |

### Maintenance Mode

| Variable | Purpose | Value |
|----------|---------|-------|
| `APP_MAINTENANCE_DRIVER` | Maintenance sync | `cache` |
| `APP_MAINTENANCE_STORE` | Where to store flag | `database` |

> Required for Laravel Cloud's multi-replica deployments to sync maintenance mode across instances.

### Email (Resend)

| Variable | Purpose | Example |
|----------|---------|---------|
| `MAIL_MAILER` | Mail driver | `resend` |
| `RESEND_API_KEY` | Resend API key | `re_xxxxxxxxx...` |
| `MAIL_FROM_ADDRESS` | Sender email | `person-444e2111c4@example.invalid` |
| `MAIL_FROM_NAME` | Sender name | `Skwix` |

### Logging

| Variable | Purpose | Value |
|----------|---------|-------|
| `LOG_CHANNEL` | Log destination | `stack` |
| `LOG_STACK` | Stack channels | `single` |
| `LOG_LEVEL` | Minimum level | `warning` |

### AI Integration

| Variable | Purpose | Value |
|----------|---------|-------|
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-xxx...` |
| `OPENROUTER_MODEL` | AI model to use | `openai/gpt-5-mini` |

### Admin Access

| Variable | Purpose | Value |
|----------|---------|-------|
| `ADMIN_SECRET_TOKEN` | Backdoor route token | Random secure string |

> Access admin at `/sudo/{ADMIN_SECRET_TOKEN}`

---

## Domain Configuration for sebdev.be

### DNS Records

Add these records in your DNS provider:

```dns
# Application (A record or CNAME - depends on Laravel Cloud IP/hostname)
A     skwix    →  [Laravel Cloud IP]
# OR
CNAME skwix    →  [app-name].laravel.cloud

# WWW redirect (optional)
CNAME www.skwix  →  skwix.example
```

### Resend Email DNS

```dns
# SPF (authorize Resend to send from your domain)
TXT   sebdev.be   →  "v=spf1 include:amazonses.com ~all"

# DMARC (email policy)
TXT   _dmarc      →  "v=DMARC1; p=none; rua=mailto:person-692eb17a47@example.invalid"

# DKIM (Resend provides this value)
CNAME resend._domainkey  →  [value from Resend dashboard]
```

### SSL/TLS

- Laravel Cloud provisions SSL automatically via Let's Encrypt
- SSL is enabled after domain verification completes
- No manual certificate management required

---

## Resend Email Setup

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for an account
3. Verify your email

### Step 2: Add Domain

1. Navigate to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter `sebdev.be`
4. Note the DNS records provided

### Step 3: Configure DNS

Add these records (values from Resend dashboard):

1. **SPF record** - TXT record on root domain
2. **DKIM record** - CNAME for `resend._domainkey`
3. **DMARC record** (optional but recommended)

### Step 4: Wait for Verification

- DNS propagation can take up to 48 hours
- Resend shows verification status in dashboard
- All records must verify before sending works

### Step 5: Generate API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it `skwix-production`
4. Copy the key (shown only once)

### Step 6: Configure Laravel

The package is already installed (`resend/resend-laravel`).

Set these environment variables in Laravel Cloud:

```env
MAIL_MAILER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=person-444e2111c4@example.invalid
MAIL_FROM_NAME=Skwix
```

### Step 7: Test Email

```bash
php artisan tinker
>>> Mail::raw('Test email from Skwix', function($msg) {
...     $msg->to('your-email@example.com')->subject('Test');
... });
```

---

## Laravel Cloud Setup

### Initial Deployment

1. **Connect GitHub Repository**
   - Go to [cloud.laravel.com](https://cloud.laravel.com)
   - Click **Create Application**
   - Connect your GitHub account
   - Select `basteau/skwix` repository

2. **Configure Application**
   - Name: `skwix`
   - Region: **EU (Frankfurt)** or nearest
   - Branch: `main`

3. **Build Settings**
   - Build command: `npm ci && npm run build`
   - PHP version: `8.2` or latest

4. **Deploy Settings**
   - Deploy command: `php artisan migrate --force`

### Provision Database

1. Go to **Resources** tab
2. Click **Add Database**
3. Select **Postgres**
4. Size: Start with smallest, scale as needed
5. Environment variables are auto-injected

### Provision Redis (Optional)

If you want faster cache/sessions:

1. Go to **Resources** tab
2. Click **Add Cache**
3. Select **Redis**
4. Update environment variables:
   - `SESSION_DRIVER=redis`
   - `CACHE_STORE=redis`
   - `QUEUE_CONNECTION=redis`

### Add Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter `skwix.example`
4. Add the DNS records shown
5. Wait for verification and SSL provisioning

### Set Environment Variables

1. Go to **Settings** → **Environment**
2. Add all required variables from the reference above
3. Mark sensitive values (API keys) as **Secret**

Required variables to add manually:
- `APP_NAME=Skwix`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://skwix.example`
- `APP_TIMEZONE=Europe/Brussels`
- `SESSION_DOMAIN=.sebdev.be`
- `MAIL_MAILER=resend`
- `RESEND_API_KEY=re_xxx...` (secret)
- `MAIL_FROM_ADDRESS=person-444e2111c4@example.invalid`
- `MAIL_FROM_NAME=Skwix`
- `OPENROUTER_API_KEY=sk-or-xxx...` (secret)
- `ADMIN_SECRET_TOKEN=xxx...` (secret)
- `LOG_LEVEL=warning`

### Configure Queue Workers

1. Go to **Settings** → **Workers**
2. Add worker if needed:
   - Command: `php artisan queue:work --tries=3`
   - Instances: 1

### Deploy

1. Push to `main` branch, or
2. Click **Deploy** in Laravel Cloud dashboard

---

## Production Checklist

Before going live, verify:

### Security
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] `APP_KEY` is set (generate with `php artisan key:generate --show`)
- [ ] `ADMIN_SECRET_TOKEN` is a secure random string
- [ ] All API keys are set as secrets

### Database
- [ ] Postgres provisioned
- [ ] Migrations run successfully
- [ ] Database connection tested

### Email
- [ ] Resend domain verified
- [ ] Test email sent successfully
- [ ] `MAIL_FROM_ADDRESS` matches verified domain

### Domain
- [ ] Custom domain added
- [ ] DNS records configured
- [ ] SSL certificate active (HTTPS works)

### Application
- [ ] Homepage loads correctly
- [ ] Login/registration works
- [ ] Game functionality works

### Monitoring
- [ ] Health check endpoint responding
- [ ] Error logging configured
- [ ] Consider adding error tracking (Sentry, Bugsnag)

---

## Troubleshooting

### Database Connection Failures

**Symptoms**: "Connection refused" or "No such host"

**Solutions**:
1. Verify database is provisioned in Laravel Cloud
2. Check if database is in same region as app
3. Try restarting the application
4. Check Laravel Cloud logs for specific errors

### Email Not Sending

**Symptoms**: Emails not delivered, no errors

**Solutions**:
1. Verify Resend domain is fully verified (all DNS records green)
2. Check `MAIL_FROM_ADDRESS` matches verified domain
3. Test in Resend dashboard with their test feature
4. Check Laravel logs for API errors
5. Ensure `MAIL_MAILER=resend` is set

### SSL Certificate Pending

**Symptoms**: "Not secure" warning, HTTPS not working

**Solutions**:
1. Verify DNS records are correct (check with `dig` or DNS checker)
2. Wait up to 24 hours for propagation
3. Ensure no conflicting DNS records
4. Check Laravel Cloud domain status

### Queue Jobs Not Processing

**Symptoms**: Jobs stuck in queue, emails delayed

**Solutions**:
1. Verify queue worker is running in Workers tab
2. Check `QUEUE_CONNECTION` is set correctly
3. If using database queue, ensure `jobs` table exists
4. Check worker logs for errors

### 500 Errors After Deploy

**Symptoms**: Application error page

**Solutions**:
1. Check `APP_DEBUG=false` doesn't hide real error
2. Review Laravel Cloud logs
3. Verify all required env vars are set
4. Check migrations ran successfully
5. Clear caches: `php artisan config:clear && php artisan cache:clear`

### Maintenance Mode Stuck

**Symptoms**: App shows maintenance page, can't exit

**Solutions**:
1. Run `php artisan up` via Laravel Cloud console
2. If using database store, check `cache` table
3. Verify `APP_MAINTENANCE_DRIVER=cache` and `APP_MAINTENANCE_STORE=database`

---

## Quick Commands Reference

Run these via Laravel Cloud console or SSH:

```bash
# Clear all caches
php artisan config:clear && php artisan cache:clear && php artisan view:clear

# Run migrations
php artisan migrate --force

# Check queue status
php artisan queue:monitor

# Generate app key (if needed)
php artisan key:generate --show

# Test database connection
php artisan tinker --execute="DB::connection()->getPdo();"

# Test email
php artisan tinker --execute="Mail::raw('Test', fn(\$m) => \$m->to('test@test.com'));"
```
