# M4 Design: Local Dual-Player

## Goal
Local multiplayer: Player 1 (← →) and Player 2 (W/S) each control a car. Same falling obstacles. First to collide loses.

## Approach
- `state.players = [{ x, y, w, h, vx, alive }]` replaces `state.player`.
- Dual mode: `state.players` has 2 entries. P1 left side, P2 right side.
- Input: `{ left, right, p2Left, p2Right, restart }`.
- Collision per player. If alive player hits obstacle → player.alive = false, status = 'gameover', state.loser = player index.
- Winner receives score.
- Render: P1 blue (#3b8), P2 orange (#f80).

## Testing
1. Single player still works (state.players[0]).
2. Dual mode: both players exist.
3. If P1 hits obstacle → gameover, P1 is loser.
4. If P2 hits obstacle → gameover, P2 is loser.
5. One player being hit does not affect the other player's car.
6. GameOver shows loser info, R resets both.
