# M2 Design: Pseudo-3D Perspective

## Goal
Upgrade rendering from flat top-down to a pseudo-3D perspective view (receding road, near objects larger, far objects smaller). Gameplay (← →, obstacles, collision, score, R restart) is unchanged.

## Approach
- World is a vertical "depth" axis `z` ranging `0..1`. `z=0` = far horizon, `z=1` = near bottom.
- Projection function `project(z) -> { screenY, scale }`:
  - `screenY = horizon + (1 - z) * (height - horizon)` so far things sit at the horizon and near things fall to the bottom.
  - `scale = perspectiveNear + (1 - z) * (1 - perspectiveNear)` clamped `[0.2, 1.0]`. At z=1, scale=1.0; at z=0, scale=perspectiveNear=0.4.
  - Effective width at depth `z` = `roadWidthAt(z) = roadWidthNear + (1-z)*(roadWidthFar - roadWidthNear)`. Obstacles/player on-screen width = baseWidth * scale.
- Player is fixed at z=1 (closest); moves only along x.
- Obstacles have `z` depth; spawn at the horizon (z small, randomized) and approach (z increases). Speed expressed in z/sec.
- Collision: compare rectangles in screen space at each obstacle's current `z` projection. Keep logic identical in principle (AABB on projected rects), but use projected coordinates.

## Data Model Extensions
- `state.player = { x, y, w, h, vx }` — keep w/h as logical units; rendered via projection.
- `obstacle = { x, z, w, h, vz }` — z-depth instead of y. `h` is small (depth ~ 0.05).
- Add `state.horizon = 80`, `state.roadWidthNear = 380`, `state.roadWidthFar = 90`, `state.perspectiveNear = 0.4`.

## Game Loop Semantics
- `update(input, dt)`:
  - Apply horizontal input as in M1.
  - For each obstacle: `z += vz * dt`; remove when `z > 1.05`.
  - Spawn: probability `0.6 * dt`, max 6 alive. New obstacles spawn at `z = 0` with random `x` (in world units, 0..1 normalized to road width).
  - Collision: project player rect and each obstacle rect; AABB in screen space.
- `render(ctx)`:
  - Sky band 0..horizon.
  - Road trapezoid from horizon (roadWidthFar) to bottom (roadWidthNear).
  - Lane stripes: a few horizontal segments at fixed z values, with perspective.
  - Obstacles drawn back-to-front (smaller/farther first) as filled rects sized by projection.
  - Player drawn last (z=1, largest).

## Migration / Compatibility
- Existing M1 tests that target `state.player.x`, `state.obstacles[].x` still pass.
- Replace `obstacle.y` with `obstacle.z`; collision-test approach updated to use projection.
- Restart / scoring semantics unchanged.

## Testing
1. Projection helper: `project(1).scale` near 1; `project(0).scale` near `perspectiveNear`.
2. Road trapezoid width: top = roadWidthFar, bottom = roadWidthNear.
3. Obstacle z increases over time.
4. Obstacle removed when z > 1.05.
5. Collision in screen space: place obstacle exactly under player at z=1 → gameover.
6. Score / restart still work.

## Out of Scope
Power-ups, two-player, leaderboard (later milestones).
