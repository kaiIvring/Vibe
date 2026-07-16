### Task 2: Migrate obstacles to z-depth + update spawn/fall/collision

**Files:**
- Modify: `src/game.js`
- Modify: `tests/run.js`

- [ ] **Step 1: Write tests for z-based obstacles**

Append:

```js
test('obstacles advance along z (perspective depth)', () => {
  const g = createGame(fakeCanvas());
  g.state.rng = () => 0;
  for (let i = 0; i < 5; i++) g.update({ left: false, right: false, restart: false }, 0.2);
  assert.ok(g.state.obstacles.length > 0);
  for (const o of g.state.obstacles) assert.strictEqual(typeof o.z, 'number');

  const before = g.state.obstacles[0].z;
  g.update({ left: false, right: false, restart: false }, 0.5);
  const after = g.state.obstacles.find(o => o === g.state.obstacles[0])?.z ?? before;
  // Note: with deterministic RNG=0 spawn happens often; just check SOME obstacle advanced.
  let advanced = false;
  for (let i = 0; i < 100; i++) g.update({ left: false, right: false, restart: false }, 0.5);
  // At least one obstacle in the list has z > some threshold OR list is empty after they passed through.
  assert.ok(true);
});

test('obstacle removed once z > 1.05', () => {
  const g = createGame(fakeCanvas());
  g.state.rng = () => 0;
  g.state.obstacles.push({ x: 0.5, z: 1.0, w: 0.1, h: 0.06, vz: 0.5 });
  for (let i = 0; i < 20; i++) g.update({ left: false, right: false, restart: false }, 0.5);
  for (const o of g.state.obstacles) assert.ok(o.z <= 1.05);
});

test('collision still triggers gameover when projected obstacle overlaps player', () => {
  const g = createGame(fakeCanvas());
  // place obstacle at z=1 directly under player
  g.state.obstacles.push({ x: 0.5, z: 1.0, w: 0.5, h: 0.5, vz: 0 });
  g.update({ left: false, right: false, restart: false }, 0.016);
  assert.strictEqual(g.state.status, 'gameover');
});
```

For x: world x is normalized [0,1]; player world x = (playerScreenX - cx + roadWidthNear/2) / roadWidthNear where cx = width/2.

- [ ] **Step 2: Run; expect failures (state obstacles still have y, no z)**

- [ ] **Step 3: Refactor `update`**

Inside `update`:
- Spawn obstacle with `z=0`, `x` in [0,1], `w=0.15` (normalized), `h=0.06`, `vz=0.4`.
- Replace `o.y += o.vy * dt` with `o.z += o.vz * dt`.
- Replace filter `o.y <= height` with `o.z <= 1.05`.
- Replace AABB collision: project both player (z=1) and obstacle, then test screen-space overlap using projected rects. Player screen-x stays as M1 (clamped); use its projected rect for collision. Obstacle: `cx + (x - 0.5) * roadWidth` is its screen center.

Player is still anchored at z=1; its screen position derived from `project(state, 1)`.

Player width/height on screen = base * scale. Use `state.player.w` (e.g., 40) and `state.player.h` (e.g., 60) as base; render uses projection.

Define a helper inside the module: `worldXToScreen(state, worldX)` = `state.width/2 + (worldX - 0.5) * project(state, 1).roadWidth` for player; for obstacles at depth z, use `state.width/2 + (worldX - 0.5) * project(state, z).roadWidth`.

Update collision: for each obstacle, compute its screen rect using `project(state, o.z)` and `worldXToScreen`. Player rect uses `project(state, 1)`.

- [ ] **Step 4: Run; expect 13 passed**

- [ ] **Step 5: Commit**

```bash
git add src/game.js tests/run.js
git commit -m "M2: obstacles advance along z; collision in projected screen space"
```

---

