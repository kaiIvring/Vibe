# M1 Top-Down Racer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundation 2D top-down browser racing game (player at bottom, ← → move, falling obstacles, collision = GameOver, R to restart, score in top-right).

**Architecture:** Pure front-end. `index.html` only contains the canvas + script tag. `src/game.js` exports `createGame(canvas)` returning a pure-logic controller (`update`, `render`, `state`). No external libraries. The HTML page hosts a tiny inline `requestAnimationFrame` driver; tests run the same module under Node by loading it via `vm` and calling `update` directly with synthetic `dt` and `input`.

**Tech Stack:** Plain JS (CommonJS-compatible via `module.exports` shim), HTML5 Canvas 2D, Node `assert` for tests.

## Global Constraints

- No npm dependencies; do NOT create `package.json`.
- Tests run via `node tests/run.js`; all assertions must pass before commit.
- Canvas logical size: 480 × 640. Game-over keys: `r`/`R` restart. Score = `floor(elapsedSeconds)`.
- Spawn rate: probability per tick `0.6 * dt` (clamped), max alive obstacles `6`.
- Player size 40×60, speed 260 px/s. Obstacle size 40×60, fall speed 180 px/s.
- Keyboard: `ArrowLeft` / `ArrowRight` for movement. `KeyR` for restart (one-shot).
- All files use LF endings.

---

### Task 1: Test harness + initial failing tests for createGame

**Files:**
- Create: `tests/run.js`
- Create: `src/game.js` (skeleton)

**Interfaces:**
- `createGame(canvas) -> { update(input, dt), render(ctx), state }`
- `state = { width, height, player, obstacles, score, status, elapsed, rng, _spawnCooldown }`
- `input = { left, right, restart }` (booleans)

- [ ] **Step 1: Write `src/game.js` skeleton exporting `createGame`**

```js
function createGame(canvas) {
  return {
    update() {},
    render() {},
    state: {}
  };
}

if (typeof module !== 'undefined') {
  module.exports = { createGame };
}
```

- [ ] **Step 2: Write `tests/run.js` with first assertions (initial state)**

```js
const assert = require('assert');
const { createGame } = require('../src/game.js');

function fakeCanvas(w = 480, h = 640) {
  return { width: w, height: h };
}
function fakeCtx() {
  return {
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', fillRect() {}, fillText() {}, clearRect() {}, save() {}, restore() {}, translate() {}, fill() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}
  };
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok -', name); passed++; }
  catch (e) { console.error('FAIL -', name, '\n', e.stack); failed++; }
}

test('createGame returns controller', () => {
  const g = createGame(fakeCanvas());
  assert.strictEqual(typeof g.update, 'function');
  assert.strictEqual(typeof g.render, 'function');
  assert.strictEqual(typeof g.state, 'object');
});

test('initial state is playing with player at bottom and score 0', () => {
  const g = createGame(fakeCanvas());
  assert.strictEqual(g.state.status, 'playing');
  assert.strictEqual(g.state.score, 0);
  assert.strictEqual(g.state.player.x, 220);
  assert.strictEqual(g.state.player.y, 560);
  assert.strictEqual(g.state.player.w, 40);
  assert.strictEqual(g.state.player.h, 60);
  assert.strictEqual(g.state.obstacles.length, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 3: Run tests; expect 2 failures (skeleton returns empty objects)**

Run: `node tests/run.js`
Expected: FAIL — `state.status` and `state.player` undefined.

- [ ] **Step 4: Implement minimal state in `createGame`**

```js
function createGame(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  const state = {
    width: W,
    height: H,
    player: { x: (W - 40) / 2, y: H - 80, w: 40, h: 60, vx: 0 },
    obstacles: [],
    score: 0,
    elapsed: 0,
    status: 'playing',
    rng: Math.random
  };
  return { update() {}, render() {}, state };
}

if (typeof module !== 'undefined') {
  module.exports = { createGame };
}
```

- [ ] **Step 5: Run tests; expect pass**

Run: `node tests/run.js`
Expected: `2 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add tests/run.js src/game.js
git commit -m "M1: scaffold createGame + initial state tests"
```

---

### Task 2: Player movement (left/right, edge clamp)

**Files:**
- Modify: `tests/run.js` (add tests)
- Modify: `src/game.js` (add update logic)

- [ ] **Step 1: Add movement tests to `tests/run.js`**

Append:

```js
test('holding right moves player right; stops at right edge', () => {
  const g = createGame(fakeCanvas());
  g.state.player.x = 200;
  for (let i = 0; i < 10; i++) g.update({ left: false, right: true, restart: false }, 0.1);
  assert.ok(g.state.player.x > 200);
  for (let i = 0; i < 200; i++) g.update({ left: false, right: true, restart: false }, 0.1);
  assert.strictEqual(g.state.player.x, 480 - 40);
});

test('holding left moves player left; stops at left edge', () => {
  const g = createGame(fakeCanvas());
  g.state.player.x = 100;
  for (let i = 0; i < 10; i++) g.update({ left: true, right: false, restart: false }, 0.1);
  assert.ok(g.state.player.x < 100);
  for (let i = 0; i < 200; i++) g.update({ left: true, right: false, restart: false }, 0.1);
  assert.strictEqual(g.state.player.x, 0);
});
```

- [ ] **Step 2: Run tests; expect 2 new failures**

Run: `node tests/run.js`

- [ ] **Step 3: Implement update logic in `src/game.js`**

Replace `update()` body:

```js
    update(input, dt) {
      if (this.state.status === 'gameover') {
        if (input.restart) { this.reset(); }
        return;
      }
      const p = this.state.player;
      const speed = 260;
      let vx = 0;
      if (input.left) vx -= speed;
      if (input.right) vx += speed;
      p.x += vx * dt;
      if (p.x < 0) p.x = 0;
      if (p.x + p.w > this.state.width) p.x = this.state.width - p.w;
      p.vx = vx;
      this.state.elapsed += dt;
      this.state.score = Math.floor(this.state.elapsed);
    },
```

Add `reset()` method and export it on the object:

```js
    reset() {
      this.state.obstacles.length = 0;
      this.state.player.x = (this.state.width - 40) / 2;
      this.state.player.y = this.state.height - 80;
      this.state.player.vx = 0;
      this.state.elapsed = 0;
      this.state.score = 0;
      this.state.status = 'playing';
    },
```

- [ ] **Step 4: Run tests; expect pass**

Run: `node tests/run.js`
Expected: 4 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add tests/run.js src/game.js
git commit -m "M1: player movement with edge clamp"
```

---

### Task 3: Obstacle spawning and falling

**Files:**
- Modify: `tests/run.js`
- Modify: `src/game.js`

- [ ] **Step 1: Add obstacle tests**

```js
test('obstacles spawn over time (deterministic RNG)', () => {
  const g = createGame(fakeCanvas());
  let seq = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.2];
  g.state.rng = () => seq.shift();
  for (let i = 0; i < 12; i++) g.update({ left: false, right: false, restart: false }, 0.5);
  assert.ok(g.state.obstacles.length > 0);
});

test('obstacles fall and are removed past bottom', () => {
  const g = createGame(fakeCanvas());
  g.state.rng = () => 0;
  for (let i = 0; i < 5; i++) g.update({ left: false, right: false, restart: false }, 0.2);
  const beforeCount = g.state.obstacles.length;
  assert.ok(beforeCount > 0);
  for (let i = 0; i < 1000; i++) g.update({ left: false, right: false, restart: false }, 0.1);
  for (const o of g.state.obstacles) assert.ok(o.y <= g.state.height);
});
```

- [ ] **Step 2: Run; expect failures**

Run: `node tests/run.js`

- [ ] **Step 3: Implement spawn + fall in `update`**

Inside `update`, after `p.vx = vx;` add:

```js
      const rng = this.state.rng;
      if (this.state.obstacles.length < 6 && rng() < 0.6 * dt) {
        const w = 40, h = 60;
        const x = Math.floor(rng() * (this.state.width - w));
        this.state.obstacles.push({ x, y: -h, w, h, vy: 180 });
      }
      for (const o of this.state.obstacles) o.y += o.vy * dt;
      this.state.obstacles = this.state.obstacles.filter(o => o.y <= this.state.height);
```

- [ ] **Step 4: Run; expect pass**

Run: `node tests/run.js`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/run.js src/game.js
git commit -m "M1: obstacle spawn + fall + cleanup"
```

---

### Task 4: Collision -> GameOver, R restart, score monotonic

**Files:**
- Modify: `tests/run.js`
- Modify: `src/game.js`

- [ ] **Step 1: Add tests**

```js
test('collision sets status to gameover', () => {
  const g = createGame(fakeCanvas());
  g.state.obstacles.push({ x: g.state.player.x, y: g.state.player.y, w: 40, h: 60, vy: 0 });
  g.update({ left: false, right: false, restart: false }, 0.016);
  assert.strictEqual(g.state.status, 'gameover');
});

test('restart resets state when in gameover', () => {
  const g = createGame(fakeCanvas());
  for (let i = 0; i < 50; i++) g.update({ left: false, right: false, restart: false }, 0.016);
  g.state.status = 'gameover';
  g.state.obstacles.push({ x: 0, y: 0, w: 40, h: 60, vy: 0 });
  g.state.score = 999;
  g.update({ left: false, right: false, restart: true }, 0.016);
  assert.strictEqual(g.state.status, 'playing');
  assert.strictEqual(g.state.score, 0);
  assert.strictEqual(g.state.obstacles.length, 0);
  assert.strictEqual(g.state.player.x, (480 - 40) / 2);
});

test('score increases monotonically with time', () => {
  const g = createGame(fakeCanvas());
  g.state.rng = () => 1; // disable spawn
  let last = -1;
  for (let i = 0; i < 100; i++) {
    g.update({ left: false, right: false, restart: false }, 0.1);
    assert.ok(g.state.score >= last);
    last = g.state.score;
  }
  assert.ok(g.state.score >= 9);
});
```

- [ ] **Step 2: Run; expect failures**

Run: `node tests/run.js`

- [ ] **Step 3: Add AABB collision check in `update`**

After obstacle filter:

```js
      const p = this.state.player;
      for (const o of this.state.obstacles) {
        if (p.x < o.x + o.w && p.x + p.w > o.x && p.y < o.y + o.h && p.y + p.h > o.y) {
          this.state.status = 'gameover';
          break;
        }
      }
```

- [ ] **Step 4: Run; expect all pass**

Run: `node tests/run.js`
Expected: 9 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add tests/run.js src/game.js
git commit -m "M1: collision detection, restart, score progression"
```

---

### Task 5: Render + index.html driver

**Files:**
- Modify: `src/game.js` (render)
- Create: `index.html`

- [ ] **Step 1: Add render smoke test**

```js
test('render does not throw with fake canvas + ctx', () => {
  const g = createGame(fakeCanvas());
  g.state.obstacles.push({ x: 0, y: 0, w: 40, h: 60, vy: 0 });
  g.render(fakeCtx());
  g.state.status = 'gameover';
  g.render(fakeCtx());
});
```

- [ ] **Step 2: Run; expect failure (render is noop)**

Run: `node tests/run.js`

- [ ] **Step 3: Implement render**

```js
    render(ctx) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, this.state.width, this.state.height);
      ctx.fillStyle = '#fff';
      for (let i = 1; i < 5; i++) {
        ctx.fillRect(i * (this.state.width / 5) - 2, 0, 4, this.state.height);
      }
      ctx.fillStyle = '#3b8';
      ctx.fillRect(this.state.player.x, this.state.player.y, this.state.player.w, this.state.player.h);
      ctx.fillStyle = '#e33';
      for (const o of this.state.obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Score: ' + this.state.score, this.state.width - 10, 24);
      if (this.state.status === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.state.width, this.state.height);
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', this.state.width / 2, this.state.height / 2 - 10);
        ctx.font = '18px sans-serif';
        ctx.fillText('Press R to restart', this.state.width / 2, this.state.height / 2 + 20);
        ctx.fillText('Score: ' + this.state.score, this.state.width / 2, this.state.height / 2 + 50);
      }
    },
```

- [ ] **Step 4: Run tests; expect 10 passed**

Run: `node tests/run.js`

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Racing Game</title>
<style>html,body{margin:0;background:#111;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#fff}canvas{background:#222;display:block}</style>
</head>
<body>
<canvas id="game" width="480" height="640"></canvas>
<script src="src/game.js"></script>
<script>
(function () {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var game = createGame(canvas);
  var input = { left: false, right: false, restart: false };
  var keyMap = { ArrowLeft: 'left', ArrowRight: 'right' };
  window.addEventListener('keydown', function (e) {
    if (keyMap[e.code]) { input[keyMap[e.code]] = true; e.preventDefault(); }
    if (e.code === 'KeyR') { input.restart = true; }
  });
  window.addEventListener('keyup', function (e) {
    if (keyMap[e.code]) { input[keyMap[e.code]] = false; e.preventDefault(); }
  });
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(input, dt);
    input.restart = false;
    game.render(ctx);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>
```

- [ ] **Step 6: Commit**

```bash
git add tests/run.js src/game.js index.html
git commit -m "M1: render + index.html driver loop"
```

---

### Task 6: Final test sweep + milestone commit

- [ ] **Step 1: Run all tests**

Run: `node tests/run.js`
Expected: 10 passed, 0 failed.

- [ ] **Step 2: Verify no stray files**

Run: `git status`
Expected: clean working tree.

- [ ] **Step 3: Tag milestone (annotated)**

```bash
git tag -a m1-done -m "Milestone 1: 2D top-down racer foundation"
```

No merge (per AGENTS.md guardrails).
