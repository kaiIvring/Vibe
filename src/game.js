function createGame(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  const state = {
    width: W,
    height: H,
    horizon: 80,
    roadWidthNear: 380,
    roadWidthFar: 90,
    perspectiveNear: 0.4,
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
      for (const o of this.state.obstacles) {
        if (p.x < o.x + o.w && p.x + p.w > o.x && p.y < o.y + o.h && p.y + p.h > o.y) {
          this.state.status = 'gameover';
          break;
        }
      }
    },
    render(ctx) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, this.state.width, this.state.height);
      ctx.fillStyle = '#fff';
      for (let i = 1; i < 5; i++) {
        ctx.fillRect(i * (this.state.width / 5) - 2, 0, 4, this.state.height);
      }
      ctx.fillStyle = '#3b8';
      ctx.fillRect(this.state.player.x, this.state.player.y, this.state.player.w, this.state.player.h);
      ctx.fillStyle = '#e33';
      for (const o of this.state.obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Score: ' + this.state.score, this.state.width - 10, 24);
      if (this.state.status === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.state.width, this.state.height);
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', this.state.width / 2, this.state.height / 2 - 10);
        ctx.font = '18px sans-serif';
        ctx.fillText('Press R to restart', this.state.width / 2, this.state.height / 2 + 20);
        ctx.fillText('Score: ' + this.state.score, this.state.width / 2, this.state.height / 2 + 50);
      }
    },
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
  module.exports = { createGame, project };
}

function project(state, z) {
  const clamped = Math.max(0, Math.min(1, z));
  const screenY = state.horizon + clamped * (state.height - state.horizon);
  const scale = state.perspectiveNear + clamped * (1 - state.perspectiveNear);
  const roadWidth = state.roadWidthFar + clamped * (state.roadWidthNear - state.roadWidthFar);
  return { screenY, scale, roadWidth };
}
