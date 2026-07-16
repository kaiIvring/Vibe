# M3 Design: Power-ups (Missile Pickup)

## Goal
Every N score points, a power-up icon falls from the top. Player collects it by overlapping. "Missile" powerup clears all obstacles on screen immediately.

## Design
- Powerup spawn: every time `score >= nextPickupScore`, drop one powerup from the top at a random x position. `nextPickupScore` starts at 5 and advances by 5 each drop (5, 10, 15, ...).
- Powerup icon: a green circle with "M" text (or star shape), falls at speed 150 px/s (in projected space, z-speed 0.3). Same z-depth as obstacles.
- Collision: player overlaps powerup → activate effect → powerup removed.
- Missile effect: set `state.obstacles.length = 0` immediately.
- HUD: show "MISSILE!" text briefly above score after pickup (1.5s timer).

## Data Model
- `state.powerups = []` — each: `{ x, z, w, h, vz, type, active }`
- `state.nextPickupScore = 5`
- `state.powerupTimer = 0` — counts down after pickup; >0 means "MISSILE!" text shown.

## Testing
1. No powerups initially; `nextPickupScore === 5`.
2. After scoring >= nextPickupScore and an update, a powerup appears.
3. Collecting powerup removes it and sets `powerupTimer > 0`.
4. Collecting powerup clears all obstacles.
5. Multiple pickup cycles: score passes 5 → drop, collect → nextPickupScore becomes 10.
6. Timer counts down and disappears.

## Edge Cases
- Only one powerup at a time (don't drop another while one is on screen).
- If a dropped powerup passes off-screen without collection, allow next drop at 5-point interval.
- Collision with powerup does not trigger gameover (only obstacles cause gameover).
