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
