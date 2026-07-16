### Task 3: Update render to draw perspective road + scaled sprites

**Files:**
- Modify: `src/game.js`
- Modify: `tests/run.js` (extend fakeCtx if needed)

- [ ] **Step 1: Extend `fakeCtx` to include new methods if render uses them (e.g., moveTo, lineTo, beginPath, fill, stroke).**

- [ ] **Step 2: Add render smoke test (already exists). It should still pass after update.**

No new test required; the existing smoke test `render does not throw with fake canvas + ctx` constrains render to use only methods on the fakeCtx stub.

- [ ] **Step 3: Rewrite `render(ctx)`**

- Clear canvas with sky color above horizon.
- Draw road trapezoid: top edge at y=horizon with width=roadWidthFar centered; bottom edge at y=height with width=roadWidthNear centered.
- Draw 3 lane-stripe rows at fixed z values (e.g., z=0.25, 0.5, 0.75) as horizontal segments across the road at the projected y, scaled by `project(state, z).roadWidth`. Use a small gap in the middle to suggest dashes.
- Sort obstacles by `z` ascending (far first), then draw each as a filled rect: width = `obstacle.w * roadWidthAtZ`, height = baseHeight * scale; position uses `worldXToScreen`.
- Draw player last at z=1.

Use only methods present on the existing fakeCtx plus any methods you added in Step 1.

- [ ] **Step 4: Run; expect 13 passed**

- [ ] **Step 5: Commit**

```bash
git add src/game.js tests/run.js
git commit -m "M2: render pseudo-3D road + scaled obstacles/player"
```

---

