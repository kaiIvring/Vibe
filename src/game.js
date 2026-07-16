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

  function playerScreenRect() {
    const p = state.player;
    return { x: p.x, y: state.height - p.h, w: p.w, h: p.h };
  }

  function obstacleScreenRect(o) {
    const proj = project(state, o.z);
    const centerX = state.width / 2 + (o.x - 0.5) * proj.roadWidth;
    const rectW = o.w * proj.roadWidth;
    const rectH = o.h * (state.height - state.horizon);
    return { x: centerX - rectW / 2, y: proj.screenY - rectH, w: rectW, h: rectH };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

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
        this.state.obstacles.push({ x: rng(), z: 0, w: 0.15, h: 0.06, vz: 0.4 });
      }
      for (const o of this.state.obstacles) o.z += o.vz * dt;
      this.state.obstacles = this.state.obstacles.filter(o => o.z <= 1.05);
      const pr = playerScreenRect();
      for (const o of this.state.obstacles) {
        const or = obstacleScreenRect(o);
        if (rectsOverlap(pr, or)) {
          this.state.status = 'gameover';
          break;
        }
      }
    },
    render(ctx) {
      const W = this.state.width, H = this.state.height;
      const hLine = this.state.horizon;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, hLine);
      ctx.fillStyle = '#444';
      ctx.fillRect(0, hLine, W, H - hLine);
      const rn = this.state.roadWidthNear / 2;
      const rf = this.state.roadWidthFar / 2;
      const cx = W / 2;
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(cx - rf, hLine);
      ctx.lineTo(cx + rf, hLine);
      ctx.lineTo(cx + rn, H);
      ctx.lineTo(cx - rn, H);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const z = 0.2 + i * 0.2;
        const p = project(this.state, z);
        const laneW = 4;
        const segLen = p.roadWidth * 0.12;
        const gap = p.roadWidth * 0.08;
        const cxSeg = cx;
        const segY = p.screenY;
        ctx.fillStyle = '#ccc';
        ctx.fillRect(cxSeg - laneW / 2 - segLen / 2, segY - 2, segLen, laneW);
        ctx.fillRect(cxSeg - laneW / 2 + segLen / 2 + gap, segY - 2, segLen, laneW);
      }
      const sorted = [...this.state.obstacles].sort((a, b) => a.z - b.z);
      for (const o of sorted) {
        const r = obstacleScreenRect(o);
        ctx.fillStyle = '#e33';
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      const pRect = playerScreenRect();
      ctx.fillStyle = '#3b8';
      ctx.fillRect(pRect.x, pRect.y, pRect.w, pRect.h);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Score: ' + this.state.score, W - 10, 24);
      if (this.state.status === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', cx, H / 2 - 10);
        ctx.font = '18px sans-serif';
        ctx.fillText('Press R to restart', cx, H / 2 + 20);
        ctx.fillText('Score: ' + this.state.score, cx, H / 2 + 50);
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
