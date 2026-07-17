# M5 Design: Score Leaderboard

## Goal
Multi-round cumulative scoring with persistent leaderboard. After each gameover, the score is recorded. A leaderboard screen shows top scores sorted descending.

## Approach
- New module `src/leaderboard.js`: pure functions `getScores()`, `addScore(name, score)`, `clearScores()`.
- In-memory array; on browser, loaded/stored via localStorage.
- Tests use a mock storage object.
- Gameover screen shows "Save Score" with input for name (or use default).
- Leaderboard accessible at any time via "L" key.

## Testing
1. addScore stores entry with name and score.
2. getScores returns sorted desc.
3. Multiple entries sorted correctly.
4. clearScores empties list.
5. Storage is used for persistence.
