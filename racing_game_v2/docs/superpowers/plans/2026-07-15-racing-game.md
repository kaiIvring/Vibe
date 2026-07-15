# Racing Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file HTML+Canvas racing game with player car, falling obstacles, score, and game-over state.

**Architecture:** Single `index.html` with inline `<style>` and `<script>`. Canvas-based rendering with `requestAnimationFrame` game loop. Object-oriented game entities (player, obstacles) with AABB collision detection.

**Tech Stack:** HTML5, CSS3, Canvas 2D API

## Global Constraints

- All code must be in a single `index.html` file
- Zero external dependencies (no libraries, fonts, or images)
- Game state machine: playing → gameover → playing
- Keyboard controls: ← → to move, R to restart
- Visual style: dark road with dashed lane markings, blue player car, red/orange obstacle cars with body/window/wheel detail

---

### Task 1: Scaffold — HTML, CSS, Canvas, Game Loop

**Files:**
- Create: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: (nothing)
- Produces: Fullscreen canvas, `gameLoop()` skeleton, game state variables, canvas auto-resize

- [ ] **Step 1: Write basic HTML structure**

Create `index.html` with DOCTYPE, meta viewport, `<title>`, empty `<style>` and `<script>` blocks.

- [ ] **Step 2: Add CSS for fullscreen canvas + score overlay**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #222; }
canvas { display: block; }
#score {
  position: fixed; top: 16px; right: 20px;
  color: #fff; font: bold 24px/1 monospace;
  z-index: 10; user-select: none;
}
```

- [ ] **Step 3: Write Canvas setup + resize handler**

```js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
```

- [ ] **Step 4: Write game state + constants**

```js
const LANE_COUNT = 3;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 90;
const BASE_SPEED = 3;
const MAX_SPEED = 10;
const SPAWN_INTERVAL = 40;

let state = 'playing'; // 'playing' | 'gameover'
let score = 0;
let frame = 0;
let obstacles = [];
```

- [ ] **Step 5: Write empty game loop**

```js
function gameLoop() {
  if (state === 'playing') {
    update();
  }
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: scaffold HTML, CSS, canvas, and game loop"
```

---

### Task 2: Player Car — Drawing + Keyboard Input

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html` (add player object, draw function, keyboard events)

**Interfaces:**
- Consumes: `canvas` dimensions, `CAR_WIDTH`, `CAR_HEIGHT` constants
- Produces: `player` object with `{ x, y, w, h }`, `drawCar(ctx, x, y, w, h, color)` function, keyboard state

- [ ] **Step 1: Create player object**

```js
const player = {
  x: 0, y: 0, w: CAR_WIDTH, h: CAR_HEIGHT,
  speed: 5
};
function resetPlayer() {
  player.x = (canvas.width - player.w) / 2;
  player.y = canvas.height - player.h - 40;
}
resetPlayer();
```

- [ ] **Step 2: Write car drawing function**

```js
function drawCar(ctx, x, y, w, h, bodyColor) {
  // body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();

  // windshield
  ctx.fillStyle = '#aaddff';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 12, w - 16, 20, 4);
  ctx.fill();

  // rear window
  ctx.fillStyle = '#88bbdd';
  ctx.beginPath();
  ctx.roundRect(x + 10, y + h - 28, w - 20, 14, 3);
  ctx.fill();

  // wheels
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.ellipse(x + 6, y + 12, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w - 6, y + 12, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 6, y + h - 12, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w - 6, y + h - 12, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}
```

- [ ] **Step 3: Add keyboard input handling**

```js
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'r' || e.key === 'R') {
    if (state === 'gameover') resetGame();
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });
```

- [ ] **Step 4: Write player update logic**

```js
function updatePlayer() {
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;
  // clamp to road bounds
  const roadLeft = canvas.width * 0.1;
  const roadRight = canvas.width * 0.9;
  player.x = Math.max(roadLeft, Math.min(roadRight - player.w, player.x));
}
```

- [ ] **Step 5: Draw player in draw()**

Add to `draw()`:
```js
drawCar(ctx, player.x, player.y, player.w, player.h, '#4488ff');
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add player car with keyboard controls"
```

---

### Task 3: Obstacles — Generation, Movement, Cleanup

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `obstacles` array, `SPAWN_INTERVAL`, `BASE_SPEED`, `LANE_COUNT`, `canvas` dimensions
- Produces: Obstacle objects in array, `updateObstacles()` function that moves them and removes off-screen ones, `spawnObstacle()` function

- [ ] **Step 1: Write obstacle spawn function

```js
function spawnObstacle() {
  const roadLeft = canvas.width * 0.1;
  const roadRight = canvas.width * 0.9;
  const roadWidth = roadRight - roadLeft;
  const laneWidth = roadWidth / LANE_COUNT;

  const lane = Math.floor(Math.random() * LANE_COUNT);
  const x = roadLeft + lane * laneWidth + (laneWidth - CAR_WIDTH) / 2;
  const speed = BASE_SPEED + Math.floor(score / 200);

  obstacles.push({
    x, y: -CAR_HEIGHT,
    w: CAR_WIDTH, h: CAR_HEIGHT,
    speed: Math.min(speed, MAX_SPEED),
    color: Math.random() > 0.5 ? '#e64a4a' : '#e68a2e'
  });
}
```

- [ ] **Step 2: Write obstacle update function**

```js
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += obstacles[i].speed;
    if (obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
    }
  }
}
```

- [ ] **Step 3: Hook spawn into update()**

Add to `update()`:
```js
frame++;
if (frame % Math.max(20, SPAWN_INTERVAL - Math.floor(score / 100)) === 0) {
  spawnObstacle();
}
updateObstacles();
```

- [ ] **Step 4: Draw obstacles in draw()**

In `draw()`, after player:
```js
obstacles.forEach(o => drawCar(ctx, o.x, o.y, o.w, o.h, o.color));
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add obstacle spawning, movement, and cleanup"
```

---

### Task 4: Collision Detection + Game Over

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `player`, `obstacles[]`, `state`
- Produces: `checkCollisions()` function, Game Over overlay rendering, transition to `'gameover'` state

- [ ] **Step 1: Write AABB collision check**

```js
function rectsIntersect(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
```

- [ ] **Step 2: Write collision check loop**

```js
function checkCollisions() {
  for (const o of obstacles) {
    if (rectsIntersect(player, o)) {
      state = 'gameover';
      break;
    }
  }
}
```

- [ ] **Step 3: Hook into update()**

Add at beginning of `update()`:
```js
updatePlayer();
checkCollisions();
```

- [ ] **Step 4: Draw Game Over overlay**

In `draw()`, after all other drawing:
```js
if (state === 'gameover') {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillStyle = '#ccc';
  ctx.font = '24px monospace';
  ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 40);
}
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add AABB collision detection and Game Over state"
```

---

### Task 5: Score, Difficulty Curve, Restart

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `score`, `state`, `frame`, `obstacles[]`
- Produces: Score display update, `resetGame()` function, difficulty curve tuning

- [ ] **Step 1: Write score update logic**

In `update()`:
```js
if (state === 'playing') {
  score++;
}
```

- [ ] **Step 2: Update score display**

```js
document.getElementById('score').textContent = Math.floor(score / 60) + 's';
```

- [ ] **Step 3: Write resetGame()**

```js
function resetGame() {
  state = 'playing';
  score = 0;
  frame = 0;
  obstacles = [];
  resetPlayer();
}
```

- [ ] **Step 4: Wire score into difficulty**

Obstacle speed already uses `score / 200` (Task 3).
Spawn interval already shortens: `Math.max(20, SPAWN_INTERVAL - Math.floor(score / 100))`.

- [ ] **Step 5: Add road drawing**

In `draw()`, before cars:
```js
// road background
ctx.fillStyle = '#333';
ctx.fillRect(0, 0, canvas.width, canvas.height);

const roadLeft = canvas.width * 0.1;
const roadRight = canvas.width * 0.9;
const roadWidth = roadRight - roadLeft;

// pavement
ctx.fillStyle = '#555';
ctx.fillRect(roadLeft, 0, roadWidth, canvas.height);

// lane markings
ctx.strokeStyle = '#fff';
ctx.lineWidth = 4;
ctx.setLineDash([20, 20]);
const laneWidth = roadWidth / LANE_COUNT;
for (let i = 1; i < LANE_COUNT; i++) {
  const lx = roadLeft + i * laneWidth;
  ctx.beginPath();
  ctx.moveTo(lx, 0);
  ctx.lineTo(lx, canvas.height);
  ctx.stroke();
}
ctx.setLineDash([]);

// road edges
ctx.strokeStyle = '#ffcc00';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(roadLeft, 0); ctx.lineTo(roadLeft, canvas.height);
ctx.moveTo(roadRight, 0); ctx.lineTo(roadRight, canvas.height);
ctx.stroke();
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add score display, difficulty curve, restart, and road rendering"
```

---

### Task 6: Polish — Visual Details, Edge Cases, Final Testing

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: All existing code
- Produces: Refined visuals, smooth edge cases, tested game

- [ ] **Step 1: Verify Canvas roundRect support**

`CanvasRenderingContext2D.roundRect()` is supported in Chrome 99+, Firefox 112+, Edge 99+. Add a polyfill fallback if needed:
```js
if (!ctx.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    return this;
  };
}
```

- [ ] **Step 2: Adjust road bounds to match road drawing**

The road left/right logic should use a shared helper:
```js
function getRoadBounds() {
  return {
    left: canvas.width * 0.1,
    right: canvas.width * 0.9,
    width: canvas.width * 0.8
  };
}
```

- [ ] **Step 3: Ensure Game Over stops update**

Guard all game-logic in `update()`:
```js
function update() {
  if (state !== 'playing') return;
  updatePlayer();
  checkCollisions();
  if (state === 'gameover') return;
  score++;
  document.getElementById('score').textContent = Math.floor(score / 60) + 's';
  frame++;
  if (frame % Math.max(20, SPAWN_INTERVAL - Math.floor(score / 100)) === 0) spawnObstacle();
  updateObstacles();
}
```

- [ ] **Step 4: Manual play-test**

Open `index.html` in browser and verify:
- Player car moves left/right with arrow keys, clamped to road
- Obstacles spawn at random lanes from top, fall at increasing speed
- Collision triggers Game Over overlay
- R key resets game
- Score increments correctly and shows in top-right
- Window resize works correctly

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: polish visuals, edge cases, and final game logic"
```
