# Racing Game V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pseudo-3D perspective rendering, powerup system, persistent leaderboard, and dual-player versus mode to the racing game.

**Architecture:** Single `index.html`. Central `GameInstance` class encapsulates a single game session (player, obstacles, powerups, score, 3D rendering). UI layer manages menu/result/leaderboard screens. Dual-player mode creates two `GameInstance`s with separate canvases.

**Tech Stack:** HTML5, CSS3, Canvas 2D API, localStorage

## Global Constraints

- All code in a single `index.html` file
- Zero external dependencies (no libraries, fonts, or images)
- Coordinate system: normalized `normalX ∈ [0,1]`, `normalY ∈ [-1, 1]`
- 3D projection: `projectTo3D(normalX, normalY) → { x, y, scale }`
- GameInstance class with constructor(canvas, controls, onGameOver)
- Keyboard: P1 uses A/D, P2 uses ArrowLeft/ArrowRight
- localStorage key: `racing_game_leaderboard`, max 10 entries

---
### Task 1: Scaffold — HTML, CSS, UI Screens, Game Flow State Machine

**Files:**
- Rewrite: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: (nothing — rewrites from scratch)
- Produces: `index.html` with HTML for menu/game/result/leaderboard, CSS for all screens, game flow state machine (`gameMode` and `screen` variables), `GameInstance` skeleton, global game loop

- [ ] **Step 1: Write full HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Racing Game</title>
  <style>/* ... */</style>
</head>
<body>
  <!-- Main Menu -->
  <div id="menu">
    <h1>🏁 RACING GAME</h1>
    <button onclick="setMode('single')">单人模式</button>
    <button onclick="setMode('dual')">双人对战</button>
    <button onclick="showLeaderboard()">排行榜</button>
  </div>

  <!-- Game Area (single mode canvas) -->
  <canvas id="gameCanvas"></canvas>

  <!-- Dual Mode Canvases -->
  <div id="dualContainer">
    <canvas id="gameCanvas1"></canvas>
    <canvas id="gameCanvas2"></canvas>
  </div>

  <!-- Result Screen -->
  <div id="result">
    <h2 id="resultTitle">GAME OVER</h2>
    <p id="resultScores"></p>
    <p id="resultVerdict"></p>
    <button onclick="showMenu()">返回主菜单</button>
  </div>

  <!-- Leaderboard Panel -->
  <div id="leaderboard">
    <h2>排行榜 TOP 10</h2>
    <ol id="lbList"></ol>
    <button onclick="clearLeaderboard()">清空</button>
    <button onclick="hideLeaderboard()">关闭</button>
  </div>

  <script>/* ... */</script>
</body>
</html>
```

- [ ] **Step 2: Add full CSS**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #111; font-family: monospace; }

#menu {
  position: fixed; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: #1a1a2e; z-index: 100;
}
#menu h1 { color: #ff6b6b; font-size: 48px; margin-bottom: 40px; }
#menu button {
  width: 240px; padding: 14px; margin: 8px; font-size: 20px;
  background: #16213e; color: #e0e0e0; border: 2px solid #0f3460;
  cursor: pointer; font-family: monospace;
}
#menu button:hover { background: #0f3460; border-color: #e94560; }

canvas { display: none; }
#gameCanvas.show { display: block; }

#dualContainer { display: none; width: 100%; height: 100%; }
#dualContainer.show { display: flex; }
#dualContainer canvas { flex: 1; height: 100%; }

#result {
  position: fixed; inset: 0; display: none; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(0,0,0,0.85); z-index: 100;
}
#result.show { display: flex; }
#result h2 { color: #ff4444; font-size: 48px; margin-bottom: 20px; }
#result p { color: #ccc; font-size: 24px; margin: 8px; }
#result button { margin-top: 30px; padding: 12px 40px; font-size: 20px; cursor: pointer; background: #16213e; color: #e0e0e0; border: 2px solid #0f3460; font-family: monospace; }

#leaderboard {
  position: fixed; inset: 0; display: none; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(0,0,0,0.9); z-index: 100;
}
#leaderboard.show { display: flex; }
#leaderboard h2 { color: #ffd700; font-size: 36px; margin-bottom: 20px; }
#leaderboard ol { color: #ccc; font-size: 20px; list-style: decimal; padding-left: 30px; }
#leaderboard li { margin: 6px 0; }
#leaderboard button { margin: 10px; padding: 8px 24px; font-size: 16px; cursor: pointer; background: #16213e; color: #e0e0e0; border: 2px solid #0f3460; font-family: monospace; }
```

- [ ] **Step 3: Write game flow state machine**

```js
let gameMode = 'menu'; // 'menu' | 'single' | 'dual' | 'result'
let instances = [];

function setMode(mode) {
  gameMode = mode;
  hideAllScreens();

  if (mode === 'single') {
    document.getElementById('gameCanvas').classList.add('show');
    const canvas = document.getElementById('gameCanvas');
    resizeCanvas(canvas);
    instances = [new GameInstance(canvas, { left: 'a', right: 'd' }, onGameOver)];
    instances[0].start();
  } else if (mode === 'dual') {
    document.getElementById('dualContainer').classList.add('show');
    const c1 = document.getElementById('gameCanvas1');
    const c2 = document.getElementById('gameCanvas2');
    resizeCanvas(c1);
    resizeCanvas(c2);
    instances = [
      new GameInstance(c1, { left: 'a', right: 'd' }, onGameOver),
      new GameInstance(c2, { left: 'ArrowLeft', right: 'ArrowRight' }, onGameOver)
    ];
    instances.forEach(i => i.start());
  }
}

function hideAllScreens() {
  document.querySelectorAll('#menu, #gameCanvas, #dualContainer, #result, #leaderboard')
    .forEach(el => el.classList.remove('show'));
  document.getElementById('menu').style.display = 'none';
}
```

- [ ] **Step 4: Write GameInstance skeleton + global game loop**

```js
class GameInstance {
  constructor(canvas, controls, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.controls = controls;
    this.onGameOver = onGameOver;
    this.state = 'idle'; // 'idle' | 'playing' | 'gameover'
    this.score = 0;
    this.frame = 0;
    this.player = { normalX: 0.5, normalY: 0.85, w: 0.08, h: 0.14, speed: 0.008 };
    this.obstacles = [];
    this.powerups = [];
  }

  reset() { /* reset state */ }
  start() { this.reset(); this.state = 'playing'; }
  update() { /* game logic */ }
  draw() { /* 3D rendering */ }

  get isOver() { return this.state === 'gameover'; }
}

// Global game loop
function gameLoop() {
  instances.forEach(inst => {
    if (inst.state === 'playing') inst.update();
    inst.draw();
  });
  requestAnimationFrame(gameLoop);
}

// Canvas resize helper
function resizeCanvas(canvas) {
  canvas.width = canvas.clientWidth || window.innerWidth;
  canvas.height = canvas.clientHeight || window.innerHeight;
}

window.addEventListener('resize', () => {
  document.querySelectorAll('canvas').forEach(resizeCanvas);
});

gameLoop();
```

- [ ] **Step 5: Wire up menu buttons and keyboard navigation**

```js
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (gameMode === 'single' || gameMode === 'dual') {
      showMenu();
    }
  }
  if ((e.key === 'r' || e.key === 'R') && gameMode === 'single') {
    const inst = instances[0];
    if (inst && inst.state === 'gameover') {
      inst.start();
      return;
    }
  }
  keys[e.key] = true;
});
document.addEventListener('keyup', e => { keys[e.key] = false; });
```

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat(v2): scaffold HTML, CSS, UI screens, GameInstance skeleton, game loop"
```

---

### Task 2: 3D Perspective Rendering

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `GameInstance` class from Task 1, `canvas` dimensions
- Produces: `projectTo3D(normalX, normalY)` function, road rendering with perspective, car drawing with depth scaling

- [ ] **Step 1: Add 3D projection function**

```js
const VANISH_Y_FRAC = 0.35;

function projectTo3D(canvas, normalX, normalY) {
  const vanishX = canvas.width / 2;
  const vanishY = canvas.height * VANISH_Y_FRAC;
  const roadBase = canvas.width * 0.8;

  const depth = 1 / (1 + (normalY + 1) * 1.5);
  const screenX = vanishX + (normalX - 0.5) * roadBase * depth;
  const screenY = vanishY + (canvas.height - vanishY) * (normalY + 1) / 2;
  return { x: screenX, y: screenY, scale: depth };
}
```

- [ ] **Step 2: Add road drawing with perspective**

Add to `GameInstance.draw()`:
```js
draw() {
  const ctx = this.ctx;
  const c = this.canvas;
  const vanishX = c.width / 2;
  const vanishY = c.height * VANISH_Y_FRAC;
  const roadBase = c.width * 0.8;

  // Sky
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, c.width, vanishY);

  // Ground
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, vanishY, c.width, c.height - vanishY);

  // Road surface — draw as filled polygon from vanish point to bottom
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(vanishX, vanishY);
  ctx.lineTo(vanishX - roadBase / 2, c.height);
  ctx.lineTo(vanishX + roadBase / 2, c.height);
  ctx.closePath();
  ctx.fill();

  // Lane markings — draw segments from depth
  const segments = 20;
  for (let i = 0; i < segments; i++) {
    const y1 = -1 + (i / segments) * 2;
    const y2 = -1 + ((i + 0.5) / segments) * 2;
    const p1 = projectTo3D(c, 1 / 3, y1);
    const p2 = projectTo3D(c, 1 / 3, y2);
    const p3 = projectTo3D(c, 2 / 3, y1);
    const p4 = projectTo3D(c, 2 / 3, y2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1, 3 * p1.scale);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  }

  // Road edges
  for (const side of [0, 1]) {
    const p1 = projectTo3D(c, side, -1);
    const p2 = projectTo3D(c, side, 1);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = Math.max(2, 4 * p1.scale);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}
```

- [ ] **Step 3: Add car drawing with depth scaling**

```js
drawCar(ctx, normalX, normalY, w, h, bodyColor, scale) {
  const c = this.canvas;
  const p = projectTo3D(c, normalX, normalY);
  const s = p.scale * scale;
  const sw = w * c.width * s * 0.8;
  const sh = h * c.height * s * 1.2;
  const x = p.x - sw / 2;
  const y = p.y - sh;

  if (y > c.height || y + sh < 0) return;

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(x, y, sw, sh, Math.max(1, 6 * s));
  ctx.fill();

  // Windshield
  ctx.fillStyle = '#aaddff';
  const ws = Math.max(1, 4 * s);
  ctx.beginPath();
  ctx.roundRect(x + sw * 0.15, y + sh * 0.12, sw * 0.7, sh * 0.22, ws);
  ctx.fill();

  // Rear window
  ctx.fillStyle = '#88bbdd';
  ctx.beginPath();
  ctx.roundRect(x + sw * 0.2, y + sh * 0.68, sw * 0.6, sh * 0.16, ws);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#333';
  const wheelW = Math.max(2, 5 * s);
  const wheelH = Math.max(3, 8 * s);
  for (const [dx, dy] of [[0.1, 0.12], [0.9, 0.12], [0.1, 0.85], [0.9, 0.85]]) {
    ctx.beginPath();
    ctx.ellipse(x + sw * dx, y + sh * dy, wheelW, wheelH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

- [ ] **Step 4: Integrate drawing into GameInstance.draw()**

```js
// Draw obstacles sorted by depth (far to near)
this.obstacles.sort((a, b) => a.normalY - b.normalY)
  .forEach(o => this.drawCar(this.ctx, o.normalX, o.normalY, o.w, o.h, o.color, 1));

// Draw player
this.drawCar(this.ctx, this.player.normalX, this.player.normalY, this.player.w, this.player.h, '#4488ff', 1);

// Game over overlay
if (this.state === 'gameover') {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', c.width / 2, c.height / 2);
  ctx.fillStyle = '#ccc';
  ctx.font = '20px monospace';
  ctx.fillText('Score: ' + Math.floor(this.score / 60) + 's', c.width / 2, c.height / 2 + 40);
}
```

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat(v2): add 3D perspective rendering for road and cars"
```

---

### Task 3: GameInstance Core — Player, Obstacles, Collision

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `GameInstance` class, `keys` global object, `projectTo3D` function
- Produces: Full `GameInstance.update()` logic: player movement, obstacle spawning/movement, collision detection, score/frame tracking

- [ ] **Step 1: Fill out GameInstance.reset()**

```js
reset() {
  this.state = 'idle';
  this.score = 0;
  this.frame = 0;
  this.obstacles = [];
  this.powerups = [];
  this.player.normalX = 0.5;
  this.player.normalY = 0.85;
  this.player.shield = false;
  this.player.speedBoost = 0;
  this.player.slowTimer = 0;
}
```

- [ ] **Step 2: Fill out GameInstance.update() with full logic**

```js
update() {
  if (this.state !== 'playing') return;

  this.updatePlayer();
  this.checkCollisions();
  if (this.state === 'gameover') return;

  this.score++;

  // Timers
  if (this.player.speedBoost > 0) this.player.speedBoost--;
  if (this.player.slowTimer > 0) this.player.slowTimer--;

  this.frame++;
  const spawnRate = Math.max(20, 40 - Math.floor(this.score / 100));
  if (this.frame % spawnRate === 0) this.spawnObstacle();

  this.updateObstacles();
  this.updatePowerups();
}
```

- [ ] **Step 3: Add player update with key controls**

```js
updatePlayer() {
  const k = this.controls;
  const speed = this.player.speedBoost > 0
    ? this.player.speed * 2
    : this.player.speed;

  if (keys[k.left]) this.player.normalX -= speed;
  if (keys[k.right]) this.player.normalX += speed;
  this.player.normalX = Math.max(0.02, Math.min(0.98, this.player.normalX));
}
```

- [ ] **Step 4: Add obstacle spawning and movement**

```js
spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const laneWidth = 1 / 3;
  const baseSpeed = this.player.slowTimer > 0 ? 0.006 : 0.012;
  this.obstacles.push({
    normalX: lane * laneWidth + laneWidth / 2,
    normalY: -1,
    w: 0.08, h: 0.14,
    speed: Math.min(baseSpeed + Math.floor(this.score / 200) * 0.002, 0.03),
    color: Math.random() > 0.5 ? '#e64a4a' : '#e68a2e'
  });
}

updateObstacles() {
  for (let i = this.obstacles.length - 1; i >= 0; i--) {
    const o = this.obstacles[i];
    o.normalY += o.speed;
    if (o.normalY > 1.2) {
      this.obstacles.splice(i, 1);
    }
  }
}
```

- [ ] **Step 5: Add collision detection**

```js
checkCollisions() {
  const p = this.player;
  for (const o of this.obstacles) {
    if (this.rectsOverlap(p, o)) {
      if (p.shield) {
        p.shield = false;
        this.obstacles.splice(this.obstacles.indexOf(o), 1);
      } else {
        this.state = 'gameover';
        this.onGameOver(this);
        return;
      }
    }
  }
}

rectsOverlap(a, b) {
  return a.normalX - a.w / 2 < b.normalX + b.w / 2 &&
         a.normalX + a.w / 2 > b.normalX - b.w / 2 &&
         a.normalY - a.h / 2 < b.normalY + b.h / 2 &&
         a.normalY + a.h / 2 > b.normalY - b.h / 2;
}
```

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat(v2): add GameInstance core logic — player, obstacles, collision"
```

---

### Task 4: Powerup System

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `GameInstance.update()` hook, `GameInstance.rectsOverlap()`, `GameInstance.draw()` hook
- Produces: Powerup spawning in `GameInstance`, three powerup types, visual indicators

- [ ] **Step 1: Add powerup spawning to GameInstance**

In `update()`, after obstacle spawn logic:
```js
if (this.frame > 120 && this.frame % 300 === 0 && Math.random() < 0.7) {
  this.spawnPowerup();
}
```

- [ ] **Step 2: Add spawnPowerup() method**

```js
spawnPowerup() {
  const types = ['speed', 'shield', 'slow'];
  const type = types[Math.floor(Math.random() * 3)];
  this.powerups.push({
    normalX: 0.1 + Math.random() * 0.8,
    normalY: -1,
    w: 0.06, h: 0.06,
    speed: 0.008,
    type: type
  });
}
```

- [ ] **Step 3: Add powerup update and collision logic**

```js
updatePowerups() {
  for (let i = this.powerups.length - 1; i >= 0; i--) {
    const p = this.powerups[i];
    p.normalY += p.speed;
    if (this.rectsOverlap(this.player, p)) {
      this.applyPowerup(p.type);
      this.powerups.splice(i, 1);
      continue;
    }
    if (p.normalY > 1.2) {
      this.powerups.splice(i, 1);
    }
  }
}

applyPowerup(type) {
  switch (type) {
    case 'speed':
      this.player.speedBoost = 180; // 3 seconds at 60fps
      break;
    case 'shield':
      this.player.shield = true;
      break;
    case 'slow':
      this.player.slowTimer = 180;
      break;
  }
}
```

- [ ] **Step 4: Add powerup drawing**

```js
drawPowerup(p) {
  const c = this.canvas;
  const ctx = this.ctx;
  const proj = projectTo3D(c, p.normalX, p.normalY);
  const size = 10 * proj.scale;
  const x = proj.x;
  const y = proj.y;

  if (y > c.height || y < 0) return;

  const pulse = Math.sin(this.frame * 0.1) * 0.3 + 0.7;

  ctx.save();
  ctx.translate(x, y);

  switch (p.type) {
    case 'speed':
      ctx.fillStyle = `rgba(76, 255, 76, ${pulse})`;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'shield':
      ctx.fillStyle = `rgba(76, 150, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'slow':
      ctx.fillStyle = `rgba(200, 100, 255, ${pulse})`;
      // 5-point star
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(a) * size;
        const py = Math.sin(a) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}
```

- [ ] **Step 5: Integrate powerup drawing into GameInstance.draw()**

After obstacle drawing and before player drawing in `draw()`:
```js
this.powerups.forEach(p => this.drawPowerup(p));
```

Then in `drawCar()`, when drawing player with active shield:
```js
if (this.player.shield) {
  ctx.strokeStyle = 'rgba(76, 150, 255, 0.6)';
  ctx.lineWidth = Math.max(1, 3 * p.scale);
  ctx.beginPath();
  ctx.arc(p.x, p.y - sh / 2, sw * 0.7, 0, Math.PI * 2);
  ctx.stroke();
}
```

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat(v2): add powerup system — speed, shield, slow"
```

---

### Task 5: Leaderboard System

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: Game over callback, result screen
- Produces: `Leaderboard` object, localStorage persistence, Top 10 display, name prompt

- [ ] **Step 1: Create Leaderboard object**

```js
const Leaderboard = {
  key: 'racing_game_leaderboard',

  getAll() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(entry) {
    let list = this.getAll();
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);
    try {
      localStorage.setItem(this.key, JSON.stringify(list));
    } catch {}
    return list;
  },

  isHighScore(score) {
    const list = this.getAll();
    return list.length < 10 || score > list[list.length - 1].score;
  },

  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch {}
  }
};
```

- [ ] **Step 2: Update onGameOver callback**

```js
function onGameOver(instance) {
  if (gameMode === 'single') {
    const score = Math.floor(instance.score / 60);
    if (Leaderboard.isHighScore(score)) {
      const name = prompt('New High Score! Enter your name (3 letters):', 'AAA');
      if (name) {
        Leaderboard.save({ name: name.slice(0, 3).toUpperCase(), score, date: new Date().toLocaleDateString() });
      }
    }
  } else if (gameMode === 'dual') {
    // Check if both players are done
    if (instances.every(i => i.isOver)) {
      showDualResult();
    }
  }
}
```

- [ ] **Step 3: Implement leaderboard display functions**

```js
function showLeaderboard() {
  hideAllScreens();
  document.getElementById('leaderboard').classList.add('show');
  const list = Leaderboard.getAll();
  const ol = document.getElementById('lbList');
  ol.innerHTML = '';
  if (list.length === 0) {
    ol.innerHTML = '<li style="color:#666">暂无记录</li>';
  } else {
    list.forEach((entry, i) => {
      const li = document.createElement('li');
      li.textContent = `${entry.name} — ${entry.score}s (${entry.date || ''})`;
      ol.appendChild(li);
    });
  }
}

function hideLeaderboard() { showMenu(); }

function clearLeaderboard() {
  if (confirm('Clear all leaderboard data?')) {
    Leaderboard.clear();
    showLeaderboard();
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "feat(v2): add leaderboard with localStorage persistence"
```

---

### Task 6: Dual-Player Versus Mode

**Files:**
- Modify: `D:\vibe\racing_game_v2\index.html`

**Interfaces:**
- Consumes: `GameInstance`, `setMode`, `onGameOver`, leaderboard
- Produces: Dual-canvas layout, result screen with win/lose/draw verdict, dual-mode game over logic

- [ ] **Step 1: Wire onGameOver for dual mode**

```js
function onGameOver(instance) {
  if (gameMode === 'dual') {
    // Save high scores
    instances.forEach(i => {
      const s = Math.floor(i.score / 60);
      if (Leaderboard.isHighScore(s)) {
        const name = prompt(`Player ${instances.indexOf(i) + 1}: New High Score! Enter name:`, 'AAA');
        if (name) {
          Leaderboard.save({ name: name.slice(0, 3).toUpperCase(), score: s, date: new Date().toLocaleDateString() });
        }
      }
    });

    // Check if both players done
    if (instances.every(i => i.isOver)) {
      showDualResult();
    }
  } else if (gameMode === 'single') {
    const score = Math.floor(instance.score / 60);
    if (Leaderboard.isHighScore(score)) {
      const name = prompt('New High Score! Enter your name (3 letters):', 'AAA');
      if (name) {
        Leaderboard.save({ name: name.slice(0, 3).toUpperCase(), score, date: new Date().toLocaleDateString() });
      }
    }
  }
}
```

- [ ] **Step 2: Add result screen logic**

```js
function showDualResult() {
  gameMode = 'result';
  hideAllScreens();
  document.getElementById('result').classList.add('show');

  const s1 = Math.floor(instances[0].score / 60);
  const s2 = Math.floor(instances[1].score / 60);

  document.getElementById('resultScores').innerHTML =
    `P1: ${s1}s &nbsp;&nbsp;|&nbsp;&nbsp; P2: ${s2}s`;

  let verdict;
  if (s1 > s2) {
    verdict = '🏆 PLAYER 1 WINS!';
  } else if (s2 > s1) {
    verdict = '🏆 PLAYER 2 WINS!';
  } else {
    verdict = '🤝 DRAW!';
  }
  document.getElementById('resultVerdict').textContent = verdict;
}
```

- [ ] **Step 3: Fix showMenu to clean up dual mode**

```js
function showMenu() {
  gameMode = 'menu';
  instances = [];
  hideAllScreens();
  document.getElementById('menu').style.display = 'flex';
}
```

- [ ] **Step 4: Verify all flow end-to-end**

Manual test checklist:
1. Menu shows with 3 buttons
2. Single player: game starts, 3D road renders, A/D moves car, obstacles fall, collision → gameover → R restart / ESC to menu
3. Dual player: two canvases appear, P1 uses A/D, P2 uses ←/→, both play independently, when both gameover → result screen
4. Leaderboard: shows saved scores, clear works
5. localStorage persists across page reloads

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat(v2): add dual-player versus mode with result screen"
```
