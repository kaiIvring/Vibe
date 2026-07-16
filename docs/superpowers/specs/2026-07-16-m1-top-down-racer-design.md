# M1 Design: 2D Top-Down Racer (Foundation)

## Goal
Minimal browser top-down racing game: bottom car controlled by Left/Right; obstacle cars fall from the top; collision = GameOver; R to restart; score in top-right (higher the longer you survive).

## Architecture
- `index.html`: canvas (480x640) + `<script src="src/game.js">` only. No external libs.
- `src/game.js`: pure-logic module exposing `createGame(canvas)` returning a controller with `update(input, dt)` / `render(ctx)` / `state`. No `requestAnimationFrame` loop inside the module — the harness (or a tiny inline driver) drives the loop, but tests call `update` directly with synthetic `dt` and `input`.
- `tests/run.js`: Node `assert` based. Loads `src/game.js` via `vm` (CommonJS shim) and verifies state transitions.

## Data Model (pure JS, mutable, single source of truth)
- `state = { player, obstacles[], score, status: 'playing'|'gameover', width, height }`
- `player = { x, y, w, h, speed, vx }` — anchored to bottom row; `vx` accumulates from input and is clamped at canvas edges.
- `obstacle = { x, y, w, h, vy }` — spawned at top with random `x`, falls at `vy`.

## Game Loop Semantics
- `update(input, dt)`: dt is in seconds (float). Multiplies velocities to get pixel movement. Status transitions: spawn obstacle on a probability per tick; check AABB collision; if collision -> `status = 'gameover'`. Score = floor of elapsed seconds.
- `render(ctx)`: draws asphalt-gray rect, lane stripes, player rect (blue), obstacle rects (red), HUD score, GameOver overlay + "Press R".
- `input`: `{ left: bool, right: bool, restart: bool }`. Restart resets `state` in place but keeps `width`/`height`. `restart` is one-shot: handled then cleared so holding R does not re-trigger.

## Edge Cases
- Player cannot leave canvas (x clamped to `[0, width - player.w]`).
- Obstacles removed once `y > height`.
- Spawn rate capped so no more than N obstacles alive (default 6).
- Collision AABB: standard overlap test.

## Testing (TDD assertions)
1. `createGame` returns object with `update`, `render`, `state`.
2. Initial state: `status === 'playing'`, player at bottom, score === 0.
3. Holding right 0.5s moves player right; stops at right edge.
4. Obstacles spawn over time (probability-driven; verified with deterministic seed).
5. Collision transitions to `gameover`.
6. Restart resets score, status, player position, clears obstacles.
7. Score increases monotonically with simulated time.

## Out of Scope (for later milestones)
3D perspective, power-ups, two-player, leaderboard.
