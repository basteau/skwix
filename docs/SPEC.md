# Skwix - Winter Word Guessing Game

A competitive multiplayer word-guessing game combining daily Wordle puzzles with strategic gambling mechanics. Players compete to guess a secret word first, earning points through daily puzzles and risking them on a wheel of fortune.

## Vision & Problem

**Problem:** Holiday gatherings need engaging group activities that work asynchronously across different schedules.

**Solution:** A 4-6 day multiplayer game where 8 players compete through daily Wordle puzzles, strategic yes/no questioning, and luck-based gambling to be the first to guess the secret word.

## Target Users

- Friend groups, family members, or colleagues (8 players per game)
- Dutch/Flemish speakers (game entirely in Dutch)
- Mobile-first users (PWA optimized)
- Ages 16+ who enjoy word games

## User Journey

### 1. Discovery & Invite
- Admin creates game with word, players, and start time
- Players receive themed email invite with invite code + direct link
- Player enters code on welcome screen → Join button activates
- Player enters lobby, waits for game start

### 2. Tutorial (First Visit Only)
- Brief intro explaining 3-part gameplay:
  - Daily Wordle (earn points)
  - Mystery Word Guessing (spend points)
  - Wheel of Fortune (gamble points)
- Always accessible via menu shortcut

### 3. Daily Gameplay Loop
1. **8:00 AM CET** - New Wordle unlocks
2. Complete Wordle → Earn 6-3 points (6 for 1 guess, 5 for 2, down to minimum 3)
3. Use points to either:
   - Make a guess (3 points = 1 yes/no question)
   - Spin the wheel (risk points for 2x or lose all)
4. Check player rankings and stats
5. Return next day

### 4. Game End
- Someone guesses the secret word correctly
- **Winner:** Confetti celebration, QR code prize, themed victory screen
- **Losers:** See winner, solution reveal, themed "better luck next time" screen
- All players redirected to end state screens

## Pages & Structure

### Welcome Screen (/)
- Winter/snowy theme, subtle decorations
- Game title + short description
- Invite code input field
- Join button (disabled until valid code)

### Lobby (/lobby)
- Waiting room after invite accepted, before game starts
- Shows other joined players with avatars
- Countdown to game start
- Winter-themed ambient animations

### Main Game (Bottom Tab Navigation)

#### Wordle Tab (/play/wordle)
- Daily 5-letter Dutch word puzzle
- Standard Wordle mechanics (6 attempts)
- Shows points earned after completion
- Locked state with countdown if already completed today
- Shows "Wordle beschikbaar om 8:00" when waiting

#### Guess Tab (/play/guess)
- Yes/No question input for the mystery word
- Costs 3 points per question
- Full history of all questions asked (by all players)
- AI responses via GPT-5.2 mini (OpenRouter)
- Disabled when insufficient points

#### Fortune Tab (/play/fortune)
- Wheel of Fortune with 8 segments (win/lose alternating)
- Input points to risk
- Spin animation
- Win: Double points | Lose: Lose all wagered
- Disabled when no points

#### Players Tab (/play/players)
- Leaderboard showing all 8 players
- Stats per player: Points, guesses made, avg Wordle guesses
- Player avatars
- Current rankings

### Win Screen (/win)
- Stunning victory celebration
- Winter confetti animation
- QR code prize display
- Winner name prominently displayed
- Themed decorations

### Lose Screen (/lose)
- Reveals winner and solution
- "Beter volgende keer!" message
- Themed consolation screen
- Option to see game stats

### Tutorial (/tutorial)
- Always accessible
- Explains all mechanics
- Visual step-by-step guide

### Admin Panel (/admin)

#### Create Game
- Secret word input (the word to guess)
- Player list (name, email, avatar for each)
- Daily start time configuration
- Game duration (4-6 days)
- Word list for daily Wordles

#### Manage Games
- Overview of active games
- Player stats and progress
- Send additional invites
- View/edit upcoming Wordle words
- End game manually if needed

## Features Deep-Dive

### Wordle System
- 5-letter Dutch/Flemish common words
- 2048 words in pool, no duplicates, no special characters
- Standard Wordle rules (green/yellow/gray)
- Points: 6 (1 guess) → 5 (2) → 4 (3) → 3 (4-6, minimum)
- One puzzle per day, resets at 8:00 AM CET
- Failed Wordle still gives minimum 3 points

### Mystery Word Guessing
- Players ask yes/no questions about the secret word
- Cost: 3 points per question
- AI (GPT-5.2 mini via OpenRouter) answers
- Response style: Normal - yes/no with minor phrasing (certainly, nope, indeed)
- AI prompt strictly forbids revealing extra info
- All questions visible to all players (shared history)
- Direct guess attempt possible (also 3 points)

### Wheel of Fortune
- 8 segments alternating: WIN | LOSE | WIN | LOSE...
- Player chooses amount to wager
- WIN: Double the wagered amount
- LOSE: Lose entire wagered amount
- Smooth spin animation with suspense
- Cannot spin with 0 points

### Player System
- Pre-seeded with name, email, avatar
- Avatar displayed throughout app
- Stats tracked: points, guesses, avg Wordle performance
- Rankings updated after each action

### Invite System
- Admin bulk-sends invites when game initialized
- Email: themed design, includes invite code + direct link
- Player enters code on welcome screen
- Code validates → enables Join button
- Player redirected to lobby

### Push Notifications
- Daily Wordle available (8:00 AM CET)
- Someone won the game
- Opt-in via PWA prompt

## Tech Stack

### Frontend
- **React 19** with Vite
- **Inertia.js** for SPA-like navigation
- **TailwindCSS v4** for styling
- **shadcn/ui** (Radix) components
- **Lucide** icons
- **TypeScript** strict mode

### Backend
- **Laravel 12** (PHP 8.2+)
- **Laravel Fortify** for auth
- **SQLite** database (simple, single file)
- **Laravel Queues** for email sending

### AI Integration
- **OpenRouter API** with GPT-5.2 mini
- Strict prompt engineering for yes/no responses

### Deployment
- **Fly.io** (as specified)
- PWA with service worker (no offline mode)
- SSL/HTTPS required

### Email
- Laravel Mail with themed templates
- HTML email matching app design

## Data Model

### Game
- id, secret_word, status (pending/active/completed)
- winner_id, created_at, starts_at, ends_at
- wordle_words (JSON array for daily puzzles)

### Player
- id, game_id, name, email, avatar_url
- points, invite_code, joined_at

### Question
- id, game_id, player_id
- question_text, answer (yes/no)
- created_at

### WordleAttempt
- id, game_id, player_id, day_number
- guesses (JSON array), completed, points_earned

### SpinResult
- id, game_id, player_id
- amount_wagered, won (boolean), points_change
- created_at

## Design & Theme

### Visual Style
- Light mode with winter blue accents
- 3 colors: light, dark, accent (winter blue)
- Subtle winter/snowy decorations
- Minimalistic, smooth, modern

### Color Direction
- Primary: Stunning modern winter blue (oklch)
- Background: Clean white/light gray
- Text: Dark charcoal
- Accents: Ice blue tones

### Mood
- Crisp, fresh, wintery
- Elegant but playful
- Celebratory for wins
- Encouraging for losses

### Typography
- Clean sans-serif for body
- Slightly playful for headings

## Language

- **Full UI in Dutch/Flemish**
- All game text, buttons, notifications in Dutch
- Wordle words: common Dutch 5-letter words

## Constraints & Requirements

### Performance
- Fast mobile performance (PWA)
- Smooth animations (60fps)
- Quick API responses (<500ms)

### Security
- Invite codes are unique and single-use
- AI cannot leak the secret word
- Admin routes protected

### Timeline
- Game duration: 4-6 days
- 8 players per game
- Daily engagement cycle

## Open Questions

- [ ] Prize system integration (currently QR to rickroll placeholder)
- [ ] Multiple concurrent games per admin?
- [ ] Player removal mid-game handling?
- [ ] Spectator mode?
