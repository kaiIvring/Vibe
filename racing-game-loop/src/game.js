function createGame(canvas, opts) {
  const W = canvas.width;
  const H = canvas.height;
  const dual = opts && opts.dual;
  const p0 = { x: (W - 40) / 2, y: H - 80, w: 40, h: 60, vx: 0, alive: true };
  const players = [p0];
  if (dual) {
    players.push({ x: (W - 40) * 0.66, y: H - 80, w: 40, h: 60, vx: 0, alive: true });
  }
  const state = {
    width: W,
    height: H,
    horizon: 80,
    roadWidthNear: 380,
    roadWidthFar: 90,
    perspectiveNear: 0.4,
    player: p0,
    players: players,
    isDual: !!dual,
    loser: -1,
    obstacles: [],
    score: 0,
    elapsed: 0,
    status: 'playing',
    rng: Math.random,
    powerups: [],
    nextPickupScore: 5,
    powerupTimer: 0
  };

  function playerScreenRect(p) {
    return { x: p.x, y: state.height - p.h, w: p.w, h: p.h };
  }

  function obstacleScreenRect(o) {
    const proj = project(state, o.z);
    const centerX = state.width / 2 + (o.x - 0.5) * proj.roadWidth;
    const rectW = o.w * proj.roadWidth;
    const rectH = o.h * (state.height - state.horizon) * proj.scale;
    return { x: centerX - rectW / 2, y: proj.screenY - rectH, w: rectW, h: rectH };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function powerupScreenRect(pu) {
    const proj = project(state, pu.z);
    const centerX = state.width / 2 + (pu.x - 0.5) * proj.roadWidth;
    const rectW = pu.w * proj.roadWidth;
    const rectH = pu.h * (state.height - state.horizon) * proj.scale;
    return { x: centerX - rectW / 2, y: proj.screenY - rectH, w: rectW, h: rectH };
  }

  return {
    update(input, dt) {
      if (this.state.status === 'gameover') {
        if (input.restart) { this.reset(); }
        return;
      }
      this.state.elapsed += dt;
      this.state.score = Math.floor(this.state.elapsed);
      const rng = this.state.rng;
      const speed = 260;
      for (let i = 0; i < this.state.players.length; i++) {
        const p = this.state.players[i];
        let vx = 0;
        if (i === 0) {
          if (input.left) vx -= speed;
          if (input.right) vx += speed;
        } else {
          if (input.p2Left) vx -= speed;
          if (input.p2Right) vx += speed;
        }
        p.x += vx * dt;
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > this.state.width) p.x = this.state.width - p.w;
        p.vx = vx;
      }
      if (this.state.obstacles.length < 6 && rng() < 0.6 * dt) {
        this.state.obstacles.push({ x: rng(), z: 0, w: 0.15, h: 0.06, vz: 0.4 });
      }
      for (const o of this.state.obstacles) o.z += o.vz * dt;
      this.state.obstacles = this.state.obstacles.filter(o => o.z <= 1.05);
      for (let i = 0; i < this.state.players.length; i++) {
        const p = this.state.players[i];
        if (!p.alive) continue;
        const pr = playerScreenRect(p);
        for (const o of this.state.obstacles) {
          const or = obstacleScreenRect(o);
          if (rectsOverlap(pr, or)) {
            p.alive = false;
            this.state.loser = i;
            this.state.status = 'gameover';
            break;
          }
        }
        if (this.state.status === 'gameover') break;
      }
      if (this.state.powerups.length === 0 && this.state.score >= this.state.nextPickupScore) {
        const rng = this.state.rng;
        this.state.powerups.push({ x: rng(), z: 0, w: 0.12, h: 0.06, vz: 0.3, type: 'missile' });
      }
      for (const pu of this.state.powerups) pu.z += pu.vz * dt;
      this.state.powerups = this.state.powerups.filter(pu => pu.z <= 1.05);
      for (let i = 0; i < this.state.players.length; i++) {
        const p = this.state.players[i];
        if (!p.alive) continue;
        const pur = playerScreenRect(p);
        let collected = false;
        for (const pu of this.state.powerups) {
          const puRect = powerupScreenRect(pu);
          if (rectsOverlap(pur, puRect)) { collected = true; break; }
        }
        if (collected) {
          this.state.obstacles.length = 0;
          this.state.powerupTimer = 1.5;
          this.state.nextPickupScore += 5;
          this.state.powerups.length = 0;
          break;
        }
      }
      if (this.state.powerupTimer > 0) {
        this.state.powerupTimer -= dt;
        if (this.state.powerupTimer < 0) this.state.powerupTimer = 0;
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
      for (const pu of this.state.powerups) {
        const r = powerupScreenRect(pu);
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = (r.h * 0.6) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', r.x + r.w / 2, r.y + r.h / 2);
        ctx.restore();
      }
      const colors = ['#3b8', '#f80'];
      for (let i = 0; i < this.state.players.length; i++) {
        const p = this.state.players[i];
        if (!p.alive) continue;
        const pr = playerScreenRect(p);
        ctx.fillStyle = colors[i];
        ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Score: ' + this.state.score, W - 10, 24);
      if (this.state.powerupTimer > 0) {
        ctx.fillStyle = '#0f0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('MISSILE!', W - 10, 44);
      }
      if (this.state.status === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        if (this.state.isDual && this.state.loser >= 0) {
          const winner = this.state.loser === 0 ? 'Player 2' : 'Player 1';
          ctx.fillText('Player ' + (this.state.loser + 1) + ' Crashed!', cx, H / 2 - 30);
          ctx.font = '24px sans-serif';
          ctx.fillText(winner + ' Wins!', cx, H / 2 + 5);
        } else {
          ctx.fillText('Game Over', cx, H / 2 - 10);
        }
        ctx.font = '18px sans-serif';
        ctx.fillText('Press R to restart', cx, H / 2 + 35);
        ctx.fillText('Score: ' + this.state.score, cx, H / 2 + 65);
      }
    },
    reset() {
      this.state.obstacles.length = 0;
      this.state.players[0].x = (this.state.width - 40) / 2;
      this.state.players[0].y = this.state.height - 80;
      this.state.players[0].vx = 0;
      this.state.players[0].alive = true;
      if (this.state.players.length > 1) {
        this.state.players[1].x = (this.state.width - 40) * 0.66;
        this.state.players[1].y = this.state.height - 80;
        this.state.players[1].vx = 0;
        this.state.players[1].alive = true;
      }
      this.state.loser = -1;
      this.state.elapsed = 0;
      this.state.score = 0;
      this.state.status = 'playing';
      this.state.powerups.length = 0;
      this.state.nextPickupScore = 5;
      this.state.powerupTimer = 0;
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
