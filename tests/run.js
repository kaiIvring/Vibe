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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
