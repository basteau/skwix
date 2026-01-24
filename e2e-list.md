# E2E Testing Checklist

- [x] **Welcome & Authentication** - Landing page, login/register flow, redirect behavior for authenticated users (UI verified: data-testid attrs present, CSRF bypass for E2E added; cookie session driver fix)
- [x] **Lobby** - `/lobby` - Game lobby display, player joining, countdown timer, player list (verified: shows "Wachten op spelers", player name, countdown)
- [x] **Wordle Game** - `/play/wordle` - Word guessing, letter feedback, keyboard input (verified: typed HELLO, green tiles, keyboard colors)
- [x] **Guess Game** - `/play/guess` - Question asking flow, answer feedback (verified: FakeAIService returns yes/no, points deducted)
- [x] **Fortune Wheel** - `/play/fortune` - Spin action, prize display, animation (verified: wheel spins, 2× win shows +97, points doubled)
- [x] **Players View** - `/play/players` - Player list display, scores (verified: shows Test Player with 194 pts, 🥇 medal)
- [ ] **Win/Lose Screens** - `/win`, `/lose` - Requires completed game with winner (skipped - no completed games in test data)
- [x] **Admin Dashboard** - `/admin` - Game overview, stats display, navigation (verified: shows games list with status badges)
- [x] **Admin Game Creation** - `/admin/create` - Form with mystery word, date picker, wordle words with shuffle
- [x] **Admin Game Management** - `/admin/game/{id}` - Wordle word editing, player stats, end game with winner selector
