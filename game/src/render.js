// Canvas renderer for Gobble Run. Draws the parallax farm world, the runner
// turkey, the farmer, hazards, corn, HUD and the three screens (title, play,
// game over). All art is vector-drawn each frame — no image assets.

import { CHASER, FIELD, RUNNER } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_OVER = 2;

const SKY = ['#2c3e50', '#4a6b8a', '#7aa3c9'];
const GROUND = '#8a6b3e';
const GROUND_DARK = '#75582f';
const GRASS = '#5d8a3e';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1; let offX = 0; let offY = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scale = Math.max(canvas.width / FIELD.width, canvas.height / FIELD.height);
    offX = (canvas.width - FIELD.width * scale) / 2;
    offY = (canvas.height - FIELD.height * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function begin(shake) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const sx = shake > 0 ? (Math.random() - 0.5) * 10 : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * 10 : 0;
    ctx.translate(offX + sx, offY + sy);
    ctx.scale(scale, scale);
    // Clip to the playfield.
    ctx.beginPath(); ctx.rect(0, 0, FIELD.width, FIELD.height); ctx.clip();
  }

  function end() { ctx.restore(); }

  // ---------- background ----------
  function drawSky(distance) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    g.addColorStop(0, SKY[0]); g.addColorStop(0.6, SKY[1]); g.addColorStop(1, SKY[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // sun
    ctx.fillStyle = '#f2d16b';
    ctx.beginPath(); ctx.arc(1060, 120, 46, 0, Math.PI * 2); ctx.fill();
    // far hills (slow parallax)
    const off1 = (distance * 0.15) % 900;
    ctx.fillStyle = '#3e6152';
    for (let i = -1; i < 3; i += 1) {
      const bx = i * 900 - off1;
      ctx.beginPath();
      ctx.moveTo(bx, FIELD.groundY);
      ctx.quadraticCurveTo(bx + 220, FIELD.groundY - 190, bx + 460, FIELD.groundY);
      ctx.quadraticCurveTo(bx + 690, FIELD.groundY - 140, bx + 900, FIELD.groundY);
      ctx.fill();
    }
    // barn + silo (mid parallax)
    const off2 = (distance * 0.4) % 1100;
    for (let i = -1; i < 2; i += 1) {
      const bx = i * 1100 - off2 + 80;
      drawBarn(bx, FIELD.groundY - 150);
    }
  }

  function drawBarn(x, y) {
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(x, y + 40, 190, 110);
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 40); ctx.lineTo(x + 95, y - 26); ctx.lineTo(x + 202, y + 40);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7d2c22';
    ctx.fillRect(x + 70, y + 90, 50, 60);
    ctx.fillStyle = '#e8d9b0';
    ctx.fillRect(x + 24, y + 62, 34, 30);
    // silo
    ctx.fillStyle = '#b8b0a0';
    ctx.fillRect(x + 210, y + 10, 44, 140);
    ctx.beginPath(); ctx.arc(x + 232, y + 10, 22, Math.PI, 0); ctx.fill();
  }

  function drawGround(distance) {
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = GRASS;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 14);
    // fence posts (fast parallax)
    const off = (distance * 1.0) % 160;
    ctx.fillStyle = '#5c4626';
    for (let i = -1; i < 10; i += 1) {
      const x = i * 160 - off;
      ctx.fillRect(x, FIELD.groundY - 34, 8, 34);
      ctx.fillRect(x, FIELD.groundY - 30, 160, 5);
    }
    ctx.fillStyle = GROUND_DARK;
    for (let i = 0; i < 22; i += 1) {
      const x = ((i * 97 - distance) % (FIELD.width + 80) + FIELD.width + 80) % (FIELD.width + 80) - 40;
      ctx.fillRect(x, FIELD.groundY + 30 + (i % 3) * 18, 40, 6);
    }
  }

  // ---------- actors ----------
  function drawTurkey(r) {
    const bob = r.onGround ? Math.abs(Math.sin(r.runPhase)) * 4 : 0;
    const y = r.y - bob;
    const cx = r.x + r.width / 2;
    ctx.save();
    if (r.ducking && r.onGround) ctx.translate(0, RUNNER.runHeight - RUNNER.duckHeight);
    // legs
    ctx.strokeStyle = '#e09a3a'; ctx.lineWidth = 4;
    const swing = Math.sin(r.runPhase * 2) * 10;
    ctx.beginPath(); ctx.moveTo(cx - 8, y + 38); ctx.lineTo(cx - 8 + (r.onGround ? swing : 4), y + 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 8, y + 38); ctx.lineTo(cx + 8 - (r.onGround ? swing : -4), y + 52); ctx.stroke();
    // body
    ctx.fillStyle = '#7a4a22';
    ctx.beginPath(); ctx.ellipse(cx, y + 24, 24, 20, 0, 0, Math.PI * 2); ctx.fill();
    // wing flapping in air
    ctx.fillStyle = '#5f3718';
    ctx.save();
    ctx.translate(cx - 4, y + 22);
    ctx.rotate(r.onGround ? Math.sin(r.runPhase) * 0.2 : -0.6);
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // head + neck
    ctx.fillStyle = '#8a5a2c';
    ctx.beginPath(); ctx.ellipse(cx + 16, y + 2, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx + 10, y + 8, 10, 10);
    // wattle + beak + eye
    ctx.fillStyle = '#c93a2c';
    ctx.beginPath(); ctx.ellipse(cx + 27, y + 6, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8b13a';
    ctx.beginPath(); ctx.moveTo(cx + 26, y + 1); ctx.lineTo(cx + 36, y + 4); ctx.lineTo(cx + 26, y + 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c1510';
    ctx.beginPath(); ctx.arc(cx + 18, y, 2.4, 0, Math.PI * 2); ctx.fill();
    // tail fan
    ctx.fillStyle = '#5f3718';
    for (const a of [-0.5, -0.25, 0, 0.25, 0.5]) {
      ctx.save(); ctx.translate(cx - 22, y + 16); ctx.rotate(a + Math.PI / 2 + Math.sin(r.runPhase) * 0.06);
      ctx.beginPath(); ctx.ellipse(0, -12, 5, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  function drawFarmer(f) {
    const groundY = FIELD.groundY;
    const swing = Math.sin(f.swing) * 8;
    const x = f.x;
    // legs
    ctx.strokeStyle = '#4a4238'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x + 14, groundY - 34); ctx.lineTo(x + 8 + swing * 0.4, groundY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 34, groundY - 34); ctx.lineTo(x + 40 - swing * 0.4, groundY); ctx.stroke();
    // overalls
    ctx.fillStyle = '#3e5a8a';
    ctx.fillRect(x + 8, groundY - 58, 34, 30);
    ctx.fillRect(x + 12, groundY - 74, 26, 20);
    // shirt + arms
    ctx.fillStyle = '#c8b896';
    ctx.fillRect(x + 4, groundY - 70, 42, 16);
    ctx.strokeStyle = '#c8b896'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x + 6, groundY - 62); ctx.lineTo(x - 10 + swing, groundY - 48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 44, groundY - 62); ctx.lineTo(x + 58 - swing, groundY - 48); ctx.stroke();
    // head + hat
    ctx.fillStyle = '#d8a878';
    ctx.beginPath(); ctx.arc(x + 25, groundY - 82, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6b3e';
    ctx.fillRect(x + 8, groundY - 96, 34, 6);
    ctx.fillRect(x + 15, groundY - 108, 20, 14);
    // pitchfork in hand
    ctx.strokeStyle = '#6b5230'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 58 - swing, groundY - 48); ctx.lineTo(x + 66 - swing, groundY - 100); ctx.stroke();
    ctx.strokeStyle = '#9aa2a8'; ctx.lineWidth = 3;
    for (const dx of [-8, 0, 8]) {
      ctx.beginPath(); ctx.moveTo(x + 66 - swing + dx, groundY - 100); ctx.lineTo(x + 66 - swing + dx, groundY - 112); ctx.stroke();
    }
  }

  function drawOven(h) {
    const w = h.width, x = h.x, y = h.y;
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(x, y, w, h.height);
    ctx.fillStyle = '#57575f';
    ctx.fillRect(x + 5, y + 5, w - 10, 22);
    // window with fire glow
    ctx.fillStyle = '#1a1210';
    ctx.fillRect(x + 10, y + 10, w - 20, 12);
    ctx.fillStyle = '#e86a2a';
    ctx.fillRect(x + 12, y + 12, w - 24, 8);
    // wheels rolling
    ctx.fillStyle = '#22222a';
    const wr = 8;
    for (const wx of [x + 12, x + w - 12]) {
      ctx.save(); ctx.translate(wx, y + h.height); ctx.rotate(h.rollPhase);
      ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#57575f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-wr, 0); ctx.lineTo(wr, 0); ctx.stroke();
      ctx.restore();
    }
    // smoke puffs
    ctx.fillStyle = 'rgba(200,200,205,0.5)';
    const p = (h.rollPhase * 10) % 30;
    ctx.beginPath(); ctx.arc(x + w / 2, y - 8 - p, 6 + p / 6, 0, Math.PI * 2); ctx.fill();
  }

  function drawKnife(h) {
    const x = h.x, y = h.y;
    // blade
    ctx.fillStyle = '#c8ced4';
    ctx.beginPath();
    ctx.moveTo(x, y + 6); ctx.lineTo(x + h.width - 14, y + 6);
    ctx.lineTo(x + h.width, y + 10); ctx.lineTo(x + h.width - 14, y + 14);
    ctx.lineTo(x, y + 16); ctx.closePath(); ctx.fill();
    // handle
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(x - 18, y + 6, 20, 10);
    // spin shimmer
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    const gl = ((h.x * 0.2) % 20) - 5;
    ctx.fillRect(x + 8 + gl, y + 6, 3, 10);
  }

  function drawPitchfork(h) {
    const x = h.x, y = h.y;
    ctx.fillStyle = '#6b5230';
    ctx.fillRect(x + 11, y, 8, h.height);
    ctx.fillStyle = '#9aa2a8';
    for (const dx of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(x + 15 + dx, y); ctx.lineTo(x + 18 + dx, y - 14);
      ctx.lineTo(x + 21 + dx, y); ctx.closePath(); ctx.fill();
    }
  }

  function drawCorn(c) {
    ctx.fillStyle = '#e8c93a';
    ctx.beginPath(); ctx.ellipse(c.x + 13, c.y + 13, 13, 8, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a524';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(c.x + 5 + i * 5, c.y + 8, 2, 8);
    // husk
    ctx.fillStyle = '#5d8a3e';
    ctx.beginPath(); ctx.moveTo(c.x + 24, c.y + 6); ctx.lineTo(c.x + 32, c.y + 16); ctx.lineTo(c.x + 24, c.y + 20); ctx.closePath(); ctx.fill();
  }

  // ---------- HUD & screens ----------
  function drawHud(state) {
    ctx.fillStyle = 'rgba(20,24,18,0.75)';
    ctx.fillRect(16, 14, 330, 64);
    ctx.fillStyle = '#f2e8d0';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 30, 42);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`DIST ${Math.floor(state.distance)}m`, 30, 64);
    ctx.fillStyle = '#f2c94c';
    ctx.fillText(`CORN ×${state.cornCount}`, 150, 64);
    ctx.fillStyle = '#8ecae6';
    ctx.fillText(`LEVEL ${state.level}`, 260, 42);
    ctx.fillText(`${Math.floor(state.elapsed)}s`, 260, 64);
  }

  function drawChaseBar(state) {
    // Danger meter: how close the farmer is.
    const gap = RUNNER.x - state.chaser.x;
    const frac = Math.max(0, Math.min(1, 1 - (gap - CHASER.minGap) / (CHASER.gapStart - CHASER.minGap)));
    ctx.fillStyle = 'rgba(20,24,18,0.75)';
    ctx.fillRect(FIELD.width - 220, 14, 204, 26);
    ctx.fillStyle = frac > 0.6 ? '#d62828' : frac > 0.3 ? '#e8a13a' : '#5d8a3e';
    ctx.fillRect(FIELD.width - 218, 16, 200 * frac, 22);
    ctx.fillStyle = '#f2e8d0';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('FARMER!', FIELD.width - 196, 32);
  }

  function drawTitle(best) {
    ctx.fillStyle = 'rgba(15,20,12,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 84px Georgia, serif';
    ctx.fillText('GOBBLE RUN', FIELD.width / 2, 210);
    ctx.fillStyle = '#f2e8d0';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText('Escape Thanksgiving — outrun the farmer!', FIELD.width / 2, 272);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Space / click to start   •   jump: Space or left tap   •   duck: ↓ or right tap', FIELD.width / 2, 330);
    if (best > 0) {
      ctx.fillStyle = '#f2c94c';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(`Best score: ${best}`, FIELD.width / 2, 390);
    }
    ctx.textAlign = 'left';
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(60,10,8,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('CAUGHT!', FIELD.width / 2, 250);
    ctx.fillStyle = '#f2e8d0';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText(`Score ${Math.floor(state.score)}   •   ${Math.floor(state.distance)}m   •   corn ×${state.cornCount}`, FIELD.width / 2, 316);
    ctx.fillText(`Best: ${best}`, FIELD.width / 2, 356);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Space / click to run again', FIELD.width / 2, 412);
    ctx.textAlign = 'left';
  }

  function draw(gameState, screen, best) {
    begin(gameState.shakeT);
    drawSky(gameState.distance);
    drawGround(gameState.distance);
    drawFarmer(gameState.chaser);
    for (const h of gameState.hazards) {
      if (h.kind === 'oven') drawOven(h);
      else if (h.kind === 'knife') drawKnife(h);
      else drawPitchfork(h);
    }
    for (const c of gameState.corns) drawCorn(c);
    drawTurkey(gameState.runner);
    if (screen === SCREEN_PLAY) { drawHud(gameState); drawChaseBar(gameState); }
    if (screen === SCREEN_TITLE) drawTitle(best);
    if (screen === SCREEN_OVER) { drawHud(gameState); drawOver(gameState, best); }
    end();
  }

  return { draw };
}
