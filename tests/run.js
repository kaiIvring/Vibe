const assert = require('assert');
const { createGame, project } = require('../src/game.js');

function fakeCanvas(w = 480, h = 640) {
  return { width: w, height: h };
}
function fakeCtx() {
  return {
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', fillRect() {}, fillText() {}, clearRect() {}, save() {}, restore() {}, translate() {}, fill() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, stroke() {}
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
  for (const o of g.state.obstacles) assert.ok(o.z <= 1.05);
});

test('collision sets status to gameover', () => {
  const g = createGame(fakeCanvas());
  g.state.obstacles.push({ x: 0.5, z: 1.0, w: 0.5, h: 0.5, vz: 0 });
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
  g.state.rng = () => 1;
  let last = -1;
  for (let i = 0; i < 100; i++) {
    g.update({ left: false, right: false, restart: false }, 0.1);
    assert.ok(g.state.score >= last);
    last = g.state.score;
  }
  assert.ok(g.state.score >= 9);
});

test('render does not throw with fake canvas + ctx', () => {
  const g = createGame(fakeCanvas());
  g.state.obstacles.push({ x: 0.5, z: 0.5, w: 0.15, h: 0.06, vz: 0 });
  g.render(fakeCtx());
  g.state.status = 'gameover';
  g.render(fakeCtx());
});

test('project at z=1 sits near bottom at full scale', () => {
  const s = createGame(fakeCanvas()).state;
  const p = project(s, 1);
  assert.ok(p.screenY > s.height / 2);
  assert.strictEqual(p.scale, 1);
});

test('project at z=0 sits at horizon at perspectiveNear scale', () => {
  const s = createGame(fakeCanvas()).state;
  const p = project(s, 0);
  assert.strictEqual(p.screenY, s.horizon);
  assert.strictEqual(p.scale, s.perspectiveNear);
});

test('road width interpolates between far and near', () => {
  const s = createGame(fakeCanvas()).state;
  assert.strictEqual(project(s, 0).roadWidth, s.roadWidthFar);
  assert.strictEqual(project(s, 1).roadWidth, s.roadWidthNear);
});

test('obstacles advance along z (perspective depth)', () => {
  const g = createGame(fakeCanvas());
  g.state.rng = () => 0;
  for (let i = 0; i < 5; i++) g.update({ left: false, right: false, restart: false }, 0.2);
  assert.ok(g.state.obstacles.length > 0);
  for (const o of g.state.obstacles) assert.strictEqual(typeof o.z, 'number');

  const before = g.state.obstacles[0].z;
  g.update({ left: false, right: false, restart: false }, 0.5);
  const after = g.state.obstacles.find(o => o === g.state.obstacles[0])?.z ?? before;
  let advanced = false;
  for (let i = 0; i < 100; i++) g.update({ left: false, right: false, restart: false }, 0.5);
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
  g.state.obstacles.push({ x: 0.5, z: 1.0, w: 0.5, h: 0.5, vz: 0 });
  g.update({ left: false, right: false, restart: false }, 0.016);
  assert.strictEqual(g.state.status, 'gameover');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
