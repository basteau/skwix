# Skwix QA Checklist

## Pre-Deployment Checks

Run these before deploying:

```bash
# Build frontend
npm run build

# Run all tests
composer test

# TypeScript check
npx tsc --noEmit

# Laravel checks
php artisan route:list --compact  # Verify routes
php artisan config:cache          # Test config compiles
```

## Post-Deployment Smoke Tests

```bash
# Automated smoke tests
./scripts/smoke-test.sh https://skwix.fly.dev
```

## Manual Testing Flows

### 1. Invitation Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to `/sudo/local-test-admin-token` | Admin dashboard loads |
| 2 | Create new game | Game form appears |
| 3 | Add 3+ players with emails | Players saved |
| 4 | Click "Verstuur Uitnodigingen" | Status changes to pending |
| 5 | Check player email | Invitation received with code |
| 6 | Go to `/welcome` | Enter code page loads |
| 7 | Enter invite code | Redirected to lobby |

### 2. Wordle Game

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to active Wordle day | Word grid appears |
| 2 | Type 5-letter word | Letters appear in grid |
| 3 | Press Enter | Row locks, colors show |
| 4 | Complete word (or fail) | Points awarded, next word |

### 3. Word Guessing Game

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to active guess day | Question input appears |
| 2 | Ask yes/no question | AI responds yes/no |
| 3 | Submit final guess | Result shown, points if correct |

### 4. Wheel of Fortune

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to active fortune day | Wheel and wager form appear |
| 2 | Enter wager amount | Amount validated |
| 3 | Spin wheel | Animation plays |
| 4 | Wheel stops | Points updated based on result |

### 5. Game End Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Admin ends game | Game status = ended |
| 2 | Winner visits `/win` | QR code displayed |
| 3 | Loser visits `/lose` | Winner announcement shown |

### 6. Leaderboard

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click players/leaderboard | Rankings displayed |
| 2 | Verify point totals | Match expected calculations |

## Production Verification Commands

```bash
# Check app status
fly status --app skwix

# Check supervisor processes
fly ssh console -C "supervisorctl status"

# Check queue health
fly ssh console -C "php artisan queue:failed"

# Check database
fly ssh console -C "php artisan tinker --execute=\"DB::select('SELECT COUNT(*) as c FROM games')\""

# View recent logs
fly logs --app skwix
```

## Known Issues

- Email requires verified custom domain in Resend (ticket s-31d9)
- Mobile: Test PWA install on iOS Safari and Android Chrome
- Test on slow 3G to verify loading states

## Sign-off

| Check | Status | Tester | Date |
|-------|--------|--------|------|
| Pre-deployment checks | ⬜ | | |
| Smoke tests pass | ✅ | amp | 2026-01-25 |
| Invitation flow | ⬜ | | |
| Wordle gameplay | ⬜ | | |
| Word guessing | ⬜ | | |
| Wheel of fortune | ⬜ | | |
| Leaderboard | ⬜ | | |
| Mobile PWA | ⬜ | | |
