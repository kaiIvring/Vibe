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
  return {
    update(input, dt) {
      if (this.state.status === 'gameover') {
        if (input.restart) { this.reset(); }
        return;
      }
      const p = this.state.player;
      const speed = 260;
      let vx = 0;
      if (input.left) vx -= speed;
      if (input.right) vx += speed;
      p.x += vx * dt;
      if (p.x < 0) p.x = 0;
      if (p.x + p.w > this.state.width) p.x = this.state.width - p.w;
      p.vx = vx;
      this.state.elapsed += dt;
      this.state.score = Math.floor(this.state.elapsed);
      const rng = this.state.rng;
      if (this.state.obstacles.length < 6 && rng() < 0.6 * dt) {
        const w = 40, h = 60;
        const x = Math.floor(rng() * (this.state.width - w));
        this.state.obstacles.push({ x, y: -h, w, h, vy: 180 });
      }
      for (const o of this.state.obstacles) o.y += o.vy * dt;
      this.state.obstacles = this.state.obstacles.filter(o => o.y <= this.state.height);
    },
    render() {},
    reset() {
      this.state.obstacles.length = 0;
      this.state.player.x = (this.state.width - 40) / 2;
      this.state.player.y = this.state.height - 80;
      this.state.player.vx = 0;
      this.state.elapsed = 0;
      this.state.score = 0;
      this.state.status = 'playing';
    },
    state
  };
}

if (typeof module !== 'undefined') {
  module.exports = { createGame };
}
