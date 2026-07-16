### Task 1: Add project() helper + tests

**Files:**
- Modify: `src/game.js`
- Modify: `tests/run.js`

- [ ] **Step 1: Write tests for `project`**

Append to `tests/run.js`:

```js
const { createGame, project } = require('../src/game.js');

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
```

- [ ] **Step 2: Run; expect ReferenceError (project not exported)**

Run: `node tests/run.js`

- [ ] **Step 3: Add `project` to `src/game.js` and export**

Add at top-level (after `createGame` definition or as a free function; do not use `this`):

```js
function project(state, z) {
  const clamped = Math.max(0, Math.min(1, z));
  const screenY = state.horizon + (1 - clamped) * (state.height - state.horizon);
  const scale = state.perspectiveNear + (1 - clamped) * (1 - state.perspectiveNear);
  const roadWidth = state.roadWidthFar + clamped * (state.roadWidthNear - state.roadWidthFar);
  return { screenY, scale, roadWidth };
}
```

Update export:

```js
if (typeof module !== 'undefined') {
  module.exports = { createGame, project };
}
```

Also add the new fields to `state` inside `createGame`:
- `state.horizon = 80`
- `state.roadWidthNear = 380`
- `state.roadWidthFar = 90`
- `state.perspectiveNear = 0.4`

- [ ] **Step 4: Run; expect 13 passed (10 existing + 3 new)**

Run: `node tests/run.js`

- [ ] **Step 5: Commit**

```bash
git add src/game.js tests/run.js
git commit -m "M2: project() helper with horizon/roadWidth/scale"
```

---

