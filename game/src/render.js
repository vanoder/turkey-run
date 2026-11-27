// All drawing: parallax backdrop, turkey, farmer, hazards, HUD, screens.
import * as C from './config.js';
import { SCREEN, playerBox, metersRun } from './world.js';

function lerp(a, b, t) { return a + (b - a) * t; }

export function draw(ctx, w, input) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawBackdrop(ctx, w);
  drawGround(ctx, w);
  if (w.screen === SCREEN.TITLE) drawTitle(ctx, w);
  else drawScene(ctx, w);
  if (w.screen === SCREEN.OVER) drawOver(ctx, w);
  if (w.screen === SCREEN.PAUSE) drawPause(ctx);
  ctx.restore();
}

// ---------- backdrop ----------
function drawBackdrop(ctx, w) {
  const g = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y);
  g.addColorStop(0, C.PAL.skyTop);
  g.addColorStop(0.55, C.PAL.skyMid);
  g.addColorStop(1, C.PAL.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, C.VIEW_W, C.GROUND_Y);

  // sun
  ctx.fillStyle = C.PAL.sun;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(980, 150, 56, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.18;
  ctx.beginPath(); ctx.arc(980, 150, 110, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // far hills (parallax 0.15)
  const off1 = (w.distancePx * 0.15) % 800;
  ctx.fillStyle = C.PAL.hillFar;
  hills(ctx, -off1, 470, 800, 150);
  hills(ctx, -off1 + 800, 470, 800, 150);

  // near hills + barn row (parallax 0.35)
  const off2 = (w.distancePx * 0.35) % 900;
  ctx.fillStyle = C.PAL.hillNear;
  hills(ctx, -off2, 520, 900, 110);
  hills(ctx, -off2 + 900, 520, 900, 110);
  barn(ctx, 620 - off2, 545);
  barn(ctx, 1520 - off2, 545);

  // fence posts (parallax 0.7)
  const off3 = (w.distancePx * 0.7) % 140;
  ctx.strokeStyle = C.PAL.fence;
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (let x = -off3; x < C.VIEW_W + 140; x += 140) {
    ctx.moveTo(x, C.GROUND_Y - 60); ctx.lineTo(x, C.GROUND_Y - 4);
  }
  ctx.moveTo(-10, C.GROUND_Y - 48); ctx.lineTo(C.VIEW_W + 10, C.GROUND_Y - 48);
  ctx.stroke();
}

function hills(ctx, x0, baseY, width, amp) {
  ctx.beginPath();
  ctx.moveTo(x0, baseY + 120);
  for (let x = 0; x <= width; x += 40) {
    const y = baseY + Math.sin((x / width) * Math.PI * 2 + x0 * 0.01) * amp * 0.35
            + Math.sin((x / width) * Math.PI * 5 + 1.3) * amp * 0.15;
    ctx.lineTo(x0 + x, y);
  }
  ctx.lineTo(x0 + width, baseY + 120);
  ctx.closePath(); ctx.fill();
}

function barn(ctx, x, y) {
  const p = C.PAL;
  ctx.fillStyle = p.barn;
  ctx.fillRect(x, y - 90, 150, 90);
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 90); ctx.lineTo(x + 75, y - 150); ctx.lineTo(x + 162, y - 90);
  ctx.closePath(); ctx.fillStyle = p.roof; ctx.fill();
  ctx.fillStyle = p.barnDark;
  ctx.fillRect(x + 55, y - 60, 40, 60);
  ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 55, y - 60); ctx.lineTo(x + 95, y);
  ctx.moveTo(x + 95, y - 60); ctx.lineTo(x + 55, y);
  ctx.stroke();
  // silo
  ctx.fillStyle = p.silo;
  ctx.fillRect(x + 165, y - 130, 44, 130);
  ctx.beginPath(); ctx.arc(x + 187, y - 130, 22, Math.PI, 0); ctx.fill();
}

function drawGround(ctx, w) {
  ctx.fillStyle = C.PAL.grass;
  ctx.fillRect(0, C.GROUND_Y - 10, C.VIEW_W, 14);
  ctx.fillStyle = C.PAL.dirt;
  ctx.fillRect(0, C.GROUND_Y + 4, C.VIEW_W, C.VIEW_H - C.GROUND_Y);
  // dirt texture chunks
  const off = (w.distancePx * 1.0) % 160;
  ctx.fillStyle = C.PAL.dirtDark;
  for (let x = -off; x < C.VIEW_W + 60; x += 160) {
    ctx.fillRect(x, C.GROUND_Y + 26, 34, 8);
    ctx.fillRect(x + 70, C.GROUND_Y + 58, 46, 9);
    ctx.fillRect(x + 120, C.GROUND_Y + 84, 26, 7);
    ctx.fillRect(x + 40, C.GROUND_Y + 66, 18, 6);
  }
}

// ---------- scene actors ----------
function drawScene(ctx, w) {
  drawSmoke(ctx, w);
  for (const h of w.hazards) drawHazard(ctx, h);
  for (const c of w.corns) if (!c.gone) drawCorn(ctx, c.x, c.y + Math.sin(c.phase) * 8, c.phase);
  drawFarmer(ctx, w);
  drawTurkey(ctx, w);
  drawHUD(ctx, w);
}

function drawSmoke(ctx, w) {
  for (const s of w.puffs) {
    ctx.globalAlpha = Math.max(0, s.a);
    ctx.fillStyle = '#cfc8c0';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHazard(ctx, h) {
  if (h.kind === 'oven') drawOven(ctx, h);
  else if (h.kind === 'knife') drawKnife(ctx, h);
  else drawPitchfork(ctx, h);
}

function drawOven(ctx, h) {
  const p = C.PAL;
  ctx.save();
  ctx.translate(h.x + h.w / 2, h.y + h.h);
  // rolling wheels
  ctx.fillStyle = '#22222a';
  ctx.beginPath(); ctx.arc(-28, -10, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(28, -10, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#55555f'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-28 + Math.cos(h.roll) * 13, -10 + Math.sin(h.roll) * 13);
  ctx.lineTo(-28 - Math.cos(h.roll) * 13, -10 - Math.sin(h.roll) * 13);
  ctx.moveTo(28 + Math.cos(h.roll) * 13, -10 + Math.sin(h.roll) * 13);
  ctx.lineTo(28 - Math.cos(h.roll) * 13, -10 - Math.sin(h.roll) * 13);
  ctx.stroke();
  // body
  ctx.fillStyle = p.oven;
  ctx.fillRect(-h.w / 2, -h.h, h.w, h.h - 20);
  ctx.fillStyle = '#2c2c33';
  ctx.fillRect(-h.w / 2 + 10, -h.h + 12, h.w - 20, 26);
  ctx.fillStyle = '#ff7b3a'; ctx.globalAlpha = 0.85;
  ctx.fillRect(-h.w / 2 + 14, -h.h + 16, h.w - 28, 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#8b8b96';
  ctx.fillRect(-h.w / 2, -h.h - 8, h.w, 10); // chimney lip
  ctx.restore();
}

function drawKnife(ctx, h) {
  const p = C.PAL;
  ctx.save();
  ctx.translate(h.x + h.w / 2, h.y + h.h / 2);
  const spin = Math.sin(h.x * 0.02) * 0.35;
  ctx.rotate(spin);
  // blade
  ctx.fillStyle = p.metal;
  ctx.beginPath();
  ctx.moveTo(-h.w / 2, -h.h / 2);
  ctx.quadraticCurveTo(0, -h.h / 2 - 8, h.w / 2 - 20, -h.h / 2);
  ctx.lineTo(h.w / 2 - 20, h.h / 2 - 2);
  ctx.quadraticCurveTo(0, h.h / 2 + 6, -h.w / 2, h.h / 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9aa0ab';
  ctx.beginPath();
  ctx.moveTo(-h.w / 2, h.h / 2 - 6);
  ctx.lineTo(h.w / 2 - 24, h.h / 2 - 8);
  ctx.lineTo(-h.w / 2, h.h / 2);
  ctx.closePath(); ctx.fill();
  // handle
  ctx.fillStyle = '#5b3a22';
  ctx.fillRect(h.w / 2 - 22, -9, 26, 18);
  ctx.restore();
}

function drawPitchfork(ctx, h) {
  const p = C.PAL;
  const bx = h.x + h.w / 2;
  ctx.strokeStyle = '#6d4a2c'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(bx, C.GROUND_Y); ctx.lineTo(bx, h.y + 24); ctx.stroke();
  ctx.fillStyle = p.metal;
  ctx.fillRect(bx - 16, h.y, 32, 12);
  ctx.fillRect(bx - 16, h.y + 10, 6, 26);
  ctx.fillRect(bx - 5, h.y + 10, 6, 26);
  ctx.fillRect(bx + 6, h.y + 10, 6, 26);
}

function drawCorn(ctx, x, y, ph) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(ph) * 0.25);
  ctx.fillStyle = C.PAL.corn;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a520';
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath(); ctx.arc(i * 6, j * 10, 2.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.fillStyle = '#7f9a3a';
  ctx.beginPath();
  ctx.ellipse(-10, -6, 5, 14, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- turkey ----------
function drawTurkey(ctx, w) {
  const p = w.player;
  const box = playerBox(w);
  const duck = p.ducking;
  const air = !p.onGround;
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h);

  // tail fan
  ctx.save();
  ctx.translate(-18, duck ? -34 : -52);
  ctx.rotate(air ? -0.25 : Math.sin(p.runPhase * 0.3) * 0.08);
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.32);
    ctx.fillStyle = i % 2 === 0 ? C.PAL.turkeyTail : '#a34a26';
    ctx.beginPath();
    ctx.ellipse(0, -20, 9, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // legs
  if (air) {
    ctx.strokeStyle = C.PAL.turkeyBeak; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -16); ctx.lineTo(-14, -2); ctx.lineTo(-8, 0);
    ctx.moveTo(8, -16); ctx.lineTo(0, -4); ctx.lineTo(8, -2);
    ctx.stroke();
  } else {
    const swing = Math.sin(p.runPhase) * 12;
    ctx.strokeStyle = C.PAL.turkeyBeak; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -18); ctx.lineTo(-4 + swing, -4); ctx.lineTo(-4 + swing + 8, 0);
    ctx.moveTo(6, -18); ctx.lineTo(6 - swing, -4); ctx.lineTo(6 - swing - 8, 0);
    ctx.stroke();
  }

  // body
  const bodyY = duck ? -24 : -42;
  const bodyR = duck ? [34, 22] : [28, 30];
  ctx.fillStyle = C.PAL.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, bodyY, bodyR[0], bodyR[1], 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.PAL.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-6, bodyY + 8, bodyR[0] * 0.7, bodyR[1] * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // wing (flap in air)
  ctx.save();
  ctx.translate(2, bodyY - 2);
  const wingA = air ? Math.sin(p.flap) * 0.9 - 0.4 : Math.sin(p.runPhase) * 0.2;
  ctx.rotate(wingA);
  ctx.fillStyle = '#93522c';
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 18, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // head + neck
  const headY = duck ? -44 : -68;
  ctx.strokeStyle = C.PAL.turkeyBody; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, bodyY - 14); ctx.lineTo(20, headY); ctx.stroke();
  ctx.fillStyle = C.PAL.turkeyBody;
  ctx.beginPath(); ctx.arc(22, headY, 13, 0, Math.PI * 2); ctx.fill();
  // beak
  ctx.fillStyle = C.PAL.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(32, headY - 2); ctx.lineTo(46, headY + 2); ctx.lineTo(32, headY + 7);
  ctx.closePath(); ctx.fill();
  // wattle
  ctx.fillStyle = C.PAL.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(30, headY + 10, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // eye
  ctx.fillStyle = '#1d130c';
  ctx.beginPath(); ctx.arc(26, headY - 4, 2.6, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ---------- farmer ----------
function drawFarmer(ctx, w) {
  const fx = w.farmer.x;
  const gy = C.GROUND_Y;
  const bob = Math.sin(w.farmer.phase) * 6;
  const legA = Math.sin(w.farmer.phase) * 14;
  ctx.save();
  ctx.translate(fx, gy);
  const p = C.PAL;
  // legs
  ctx.strokeStyle = p.farmerOveralls; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -46); ctx.lineTo(-10 + legA * 0.6, -20); ctx.lineTo(-10 + legA, 0);
  ctx.moveTo(14, -46); ctx.lineTo(14 - legA * 0.6, -20); ctx.lineTo(14 - legA, 0);
  ctx.stroke();
  // torso: shirt + overalls
  ctx.fillStyle = p.farmerShirt;
  ctx.fillRect(-8, -84 + bob * 0.3, 34, 42);
  ctx.fillStyle = p.farmerOveralls;
  ctx.fillRect(-4, -58 + bob * 0.3, 28, 20);
  ctx.fillRect(2, -66 + bob * 0.3, 6, 10);
  ctx.fillRect(16, -66 + bob * 0.3, 6, 10);
  // head
  ctx.fillStyle = p.farmerSkin;
  ctx.beginPath(); ctx.arc(12, -92 + bob * 0.4, 13, 0, Math.PI * 2); ctx.fill();
  // hat
  ctx.fillStyle = p.farmerHat;
  ctx.beginPath(); ctx.ellipse(12, -100 + bob * 0.4, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(2, -114 + bob * 0.4, 20, 14);
  // beard-ish shade
  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath(); ctx.arc(10, -86 + bob * 0.4, 8, 0, Math.PI); ctx.fill();
  // pitchfork arm
  ctx.strokeStyle = p.farmerSkin; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(6, -76 + bob * 0.3); ctx.lineTo(-18, -60 + bob * 0.3); ctx.stroke();
  ctx.strokeStyle = '#6d4a2c'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-24, -20); ctx.lineTo(-18, -76 + bob * 0.3); ctx.stroke();
  ctx.fillStyle = C.PAL.metal;
  ctx.beginPath();
  ctx.moveTo(-24, -76 + bob * 0.3);
  ctx.lineTo(-32, -96 + bob * 0.3); ctx.lineTo(-24, -86 + bob * 0.3);
  ctx.lineTo(-16, -96 + bob * 0.3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---------- HUD ----------
function drawHUD(ctx, w) {
  const meters = metersRun(w);
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#f4e9d4';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 6;
  ctx.fillText(`SCORE ${Math.floor(w.score)}`, 28, 22);
  ctx.fillText(`${meters} m`, 28, 52);
  ctx.fillText(`LEVEL ${w.level}`, 28, 82);
  ctx.fillText(`${w.time.toFixed(0)}s`, 28, 112);
  // corn counter
  drawCornIcon(ctx, 40, 146);
  ctx.fillStyle = C.PAL.corn;
  ctx.fillText(`× ${w.corn}`, 58, 136);
  ctx.shadowBlur = 0;

  // farmer meter
  const mx = C.VIEW_W - 40, my = 34, mw = 300, mh = 26;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f4e9d4';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 6;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText('FARMER!', mx, my - 26);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(mx - mw, my, mw, mh);
  const t = w.farmerMeter;
  const mg = ctx.createLinearGradient(mx - mw, 0, mx, 0);
  mg.addColorStop(0, '#7fbf4a'); mg.addColorStop(0.6, '#e8b23a'); mg.addColorStop(1, '#d33a3a');
  ctx.fillStyle = mg;
  ctx.fillRect(mx - mw * t, my, mw * t, mh);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
  ctx.strokeRect(mx - mw, my, mw, mh);
  if (t > 0.7) {
    ctx.fillStyle = `rgba(255,80,60,${0.25 + 0.25 * Math.sin(w.time * 12)})`;
    ctx.fillRect(mx - mw, my - 4, mw, mh + 8);
  }
}

function drawCornIcon(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.55, 0.55);
  drawCorn(ctx, 0, 0, 0);
  ctx.restore();
}

// ---------- screens ----------
function drawTitle(ctx, w) {
  ctx.fillStyle = 'rgba(20,10,30,0.45)';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 14;
  ctx.fillStyle = C.PAL.corn;
  ctx.font = '900 96px system-ui, sans-serif';
  ctx.fillText('GOBBLE RUN', C.VIEW_W / 2, 220);
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#f4e9d4';
  ctx.font = '500 30px system-ui, sans-serif';
  ctx.fillText('Escape Thanksgiving — outrun the farmer!', C.VIEW_W / 2, 300);
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillText('Space / W / ↑ or click left = jump    S / ↓ or click right = duck', C.VIEW_W / 2, 400);
  ctx.fillText('P / Esc = pause    Grab corn for +150!', C.VIEW_W / 2, 436);
  ctx.fillStyle = C.PAL.turkeyTail;
  ctx.font = '700 26px system-ui, sans-serif';
  if (w.best > 0) ctx.fillText(`BEST: ${w.best}`, C.VIEW_W / 2, 520);
  ctx.fillStyle = '#f4e9d4';
  const pulse = 0.6 + 0.4 * Math.sin(w.time * 4);
  ctx.globalAlpha = pulse;
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO START', C.VIEW_W / 2, 600);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawOver(ctx, w) {
  ctx.fillStyle = 'rgba(160,20,20,0.35)';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff5a4a';
  ctx.font = '900 100px system-ui, sans-serif';
  ctx.fillText('CAUGHT!', C.VIEW_W / 2, 200);
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#f4e9d4';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText(`SCORE ${Math.floor(w.score)}`, C.VIEW_W / 2, 320);
  ctx.fillText(`${metersRun(w)} m  ·  ${w.corn} corn  ·  ${w.time.toFixed(0)}s  ·  level ${w.level}`, C.VIEW_W / 2, 366);
  ctx.fillStyle = C.PAL.corn;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(w.score >= w.best ? 'NEW BEST!' : `BEST: ${w.best}`, C.VIEW_W / 2, 440);
  const pulse = 0.6 + 0.4 * Math.sin(w.time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#f4e9d4';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RUN AGAIN', C.VIEW_W / 2, 560);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(10,6,20,0.55)';
  ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4e9d4';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText('PAUSED', C.VIEW_W / 2, C.VIEW_H / 2 - 20);
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillText('P / Esc to resume', C.VIEW_W / 2, C.VIEW_H / 2 + 40);
}
