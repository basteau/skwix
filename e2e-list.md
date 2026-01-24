# E2E Testing Checklist

- [ ] **Welcome & Authentication** - Landing page, login/register flow, redirect behavior for authenticated users
- [ ] **Lobby** - `/lobby` - Game lobby display, player joining, invite handling
- [ ] **Wordle Game** - `/play/wordle` - Word guessing, letter feedback, keyboard input, game state persistence
- [ ] **Guess Game** - `/play/guess` - Question asking flow, answer feedback, game progression
- [ ] **Fortune Wheel** - `/play/fortune` - Spin action, prize display, animation completion
- [ ] **Players View** - `/play/players` - Player list display, scores, status indicators
- [ ] **Win/Lose Screens** - `/win`, `/lose` - End game display, score summary, restart options
- [ ] **Admin Dashboard** - `/admin` - Game overview, stats display, navigation to game management
- [ ] **Admin Game Creation** - `/admin/create` - Form validation, random word generation, game setup
- [ ] **Admin Game Management** - `/admin/game/{id}` - Wordle word updates, game ending, state modifications
