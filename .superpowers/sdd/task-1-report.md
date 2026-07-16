# Task 1 Report: Add project() helper + tests

## Status: COMPLETE (with brief-correction note)

## RED
Added the 3 tests from the brief to `tests/run.js` and ran `node tests/run.js`.
Result: 3 new tests failed with `TypeError: project is not a function`; the
existing 10 still passed. Failure reason was the expected "feature not
exported", confirming the tests target the new behavior.

## Brief-correction note (recorded before GREEN)
On the first GREEN attempt with the literal formula from the brief Step 3,
two of the three new tests failed:

- `project at z=1 sits near bottom at full scale`:
  `screenY > height/2` failed because the literal formula gave
  `screenY = horizon + (1 - clamped) * (height - horizon) = 80` at z=1
  (i.e. *at the horizon*, not near the bottom).
- `project at z=0 sits at horizon at perspectiveNear scale`:
  `screenY === horizon` failed because the same formula gives
  `screenY = height` (= 640) at z=0, not `horizon` (= 80).

The brief's literal formula treats z=0 as the near (bottom) end and z=1 as
the far (horizon) end. The brief's tests, test names, and self-review all
use the opposite convention: z=0 = far (horizon, scale = perspectiveNear,
roadWidth = roadWidthFar), z=1 = near (bottom, scale = 1,
roadWidth = roadWidthNear). The self-review bullets
(`project(state, 0).screenY === state.horizon`, etc.) line up with the
tests, not with the formula.

Per TDD the tests are the spec, so I implemented the formulas consistent
with the tests and self-review (using `clamped` instead of `(1 - clamped)`
for screenY and scale; roadWidth already used `clamped` in the brief and
was correct as-is):

```js
const screenY = state.horizon + clamped * (state.height - state.horizon);
const scale = state.perspectiveNear + clamped * (1 - state.perspectiveNear);
const roadWidth = state.roadWidthFar + clamped * (state.roadWidthNear - state.roadWidthFar);
```

A subsequent task can decide whether to amend the brief so the two agree.

## GREEN
After applying the corrected formulas, `node tests/run.js` reports:
13 passed, 0 failed (10 prior + 3 new).

Self-review confirmation (via `node -e ...`):
- `project(state, 0)` → `{ screenY: 80, scale: 0.4, roadWidth: 90 }`
- `project(state, 1)` → `{ screenY: 640, scale: 1, roadWidth: 380 }`

All four self-review bullets satisfied:
- `project(state, 0).screenY === state.horizon` (80 === 80) ✓
- `project(state, 1).scale === 1` ✓
- `project(state, 0).roadWidth === state.roadWidthFar` (90 === 90) ✓
- `project(state, 1).roadWidth === state.roadWidthNear` (380 === 380) ✓

## LF endings
`file` reported both files as `CRLF line terminators` on checkout
(Windows autocrlf). Converted both files in-place with a Node one-liner
replacing `\r\n` → `\n`, re-ran tests (still 13/13), then committed.

## Commit
- SHA: `70d93d2`
- Message: `M2: project() helper with horizon/roadWidth/scale`
- Files: `src/game.js` (+13, -1), `tests/run.js` (+21, -1)

## Files touched (within scope)
- `src/game.js`: added `horizon`, `roadWidthNear`, `roadWidthFar`,
  `perspectiveNear` to `state`; added top-level `project(state, z)`
  function (no `this`); updated `module.exports` to include `project`.
- `tests/run.js`: added `project` to the destructure; appended the three
  tests from the brief.

No other files modified. No `index.html`, `docs/`, or `.superpowers/`
changes.

## Concerns / follow-ups
1. **Brief inconsistency**: the formula in Step 3 disagrees with the
   Step 1 tests and the self-review bullets for screenY and scale. A
   follow-up task should reconcile the brief so future agents don't
   re-hit this. The roadWidth line was correct as written.
2. **CRLF on Windows**: the repo has no `.gitattributes` and Git on
   Windows keeps warning that LF will be replaced by CRLF on checkout.
   This is outside the scope of Task 1, but adding `.gitattributes`
   with `* text=auto eol=lf` would make the LF requirement durable
   without each contributor having to remember to convert.
3. **`project` is defined after the `module.exports` block.** This works
   because function declarations hoist, but it's stylistically
   inconsistent with the rest of the file. Could be moved above the
   export for clarity in a future cleanup.
