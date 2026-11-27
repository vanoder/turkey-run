// World rules, state, physics, spawning, collisions — no drawing.
import * as C from './config.js';
import { makeRng } from './random.js';

export const SCREEN = { TITLE: 0, PLAY: 1, OVER: 2, PAUSE: 3 };

export function createWorld(seed = 12345) {
  return {
    screen: SCREEN.TITLE,
    rng: makeRng(seed),
    seed,
    time: 0,
    distancePx: 0,
    speed: C.BASE_SPEED,
    level: 1,
    score: 0,
    corn: 0,
    best: Number(localStorage.getItem('gobbleRunBest') || 0),
    player: {
      x: C.PLAYER_X, y: C.GROUND_Y, vx: 0, vy: 0,
      onGround: true, ducking: false, duckLeft: 0,
      coyote: 0, runPhase: 0, flap: 0,
    },
    farmer: { x: C.FARMER_X_FAR, phase: 0 },
    hazards: [],   // {kind:'oven'|'knife'|'pitch', x,y,w,h, passed, missBonusGiven, roll, smoke}
    corns: [],     // {x,y,phase,taken}
    puffs: [],     // smoke {x,y,r,a,vx,vy}
    spawnTimer: 1.2,
    farmerMeter: 0, // 0..1
  };
}

export function startRun(w) {
  const fresh = createWorld(w.seed);
  fresh.screen = SCREEN.PLAY;
  Object.assign(w, fresh);
}

export function playerBox(w) {
  const p = w.player;
  const size = p.ducking ? { w: C.DUCK_W, h: C.DUCK_H } : { w: C.STAND_W, h: C.STAND_H };
  return { x: p.x - size.w / 2, y: p.y - size.h, w: size.w, h: size.h };
}

function spawnHazard(w) {
  const lv = w.level;
  const kinds = ['oven', 'pitch'];
  if (lv >= 2) kinds.push('knife');
  const kind = kinds[Math.floor(w.rng() * kinds.length)];
  const h = { kind, missBonusGiven: false, roll: w.rng() * Math.PI * 2 };
  if (kind === 'oven') Object.assign(h, { x: C.VIEW_W + 80, y: C.GROUND_Y - C.OVEN_H, w: C.OVEN_W, h: C.OVEN_H });
  if (kind === 'knife') Object.assign(h, { x: C.VIEW_W + 80, y: C.KNIFE_Y, w: C.KNIFE_W, h: C.KNIFE_H });
  if (kind === 'pitch') Object.assign(h, { x: C.VIEW_W + 80, y: C.GROUND_Y - C.PITCH_H, w: C.PITCH_W, h: C.PITCH_H });
  w.hazards.push(h);
  // pair spawn on later levels
  if (lv >= C.PAIR_CHANCE_MIN_LEVEL && w.rng() < 0.35) {
    const k2 = kinds[Math.floor(w.rng() * kinds.length)];
    const h2 = { kind: k2, missBonusGiven: false, roll: w.rng() * Math.PI * 2, x: C.VIEW_W + 80 + 180 + w.rng() * 120 };
    if (k2 === 'oven') Object.assign(h2, { y: C.GROUND_Y - C.OVEN_H, w: C.OVEN_W, h: C.OVEN_H });
    if (k2 === 'knife') Object.assign(h2, { y: C.KNIFE_Y, w: C.KNIFE_W, h: C.KNIFE_H });
    if (k2 === 'pitch') Object.assign(h2, { y: C.GROUND_Y - C.PITCH_H, w: C.PITCH_W, h: C.PITCH_H });
    w.hazards.push(h2);
  }
}

function spawnCorn(w) {
  const heights = [C.GROUND_Y - 70, C.GROUND_Y - 150, C.GROUND_Y - 230];
  const y = heights[Math.floor(w.rng() * heights.length)];
  w.corns.push({ x: C.VIEW_W + 60 + w.rng() * 200, y, phase: w.rng() * Math.PI * 2, taken: false });
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function doJump(w) {
  const p = w.player;
  if (p.onGround || p.coyote > 0) {
    p.vy = C.JUMP_VY;
    p.onGround = false;
    p.coyote = 0;
    return true;
  }
  return false;
}

// One fixed step. scriptedInputs is an optional array of actions injected per step (for ?shot).
export function stepWorld(w, dt, input, scripted = null) {
  if (w.screen !== SCREEN.PLAY) return;

  w.time += dt;
  w.distancePx += w.speed * dt;
  const meters = Math.floor(w.distancePx / C.METER_PX);
  const newLevel = Math.min(C.MAX_LEVEL, 1 + Math.floor(w.time / C.LEVEL_TIME));
  if (newLevel !== w.level) w.level = newLevel;
  w.speed = C.BASE_SPEED + (w.level - 1) * C.SPEED_PER_LEVEL;

  // farmer creep
  w.farmer.x = Math.min(C.FARMER_X_NEAR, w.farmer.x + C.FARMER_CREEP * dt * (1 + (w.level - 1) * 0.35));
  w.farmer.phase += dt * 9;
  w.farmerMeter = (w.farmer.x - C.FARMER_X_FAR) / (C.FARMER_X_NEAR - C.FARMER_X_FAR);
  if (w.farmer.x >= C.PLAYER_X - C.FARMER_CATCH) return endRun(w);

  // input
  if (scripted) {
    if (scripted.jump) { input.state.jumpEdge = true; input.state.jumpBuffer = C.JUMP_BUFFER; }
    if (scripted.duck) { w.player.duckLeft = C.DUCK_TIME; }
  } else {
    if (input.consumeJump()) input.state.jumpBuffer = C.JUMP_BUFFER;
    if (input.state.duckHeld) w.player.duckLeft = C.DUCK_TIME;
  }

  const p = w.player;
  if (input.state.jumpBuffer > 0) {
    if (doJump(w)) input.state.jumpBuffer = 0;
  }
  p.duckLeft = Math.max(0, p.duckLeft - dt);
  p.ducking = p.duckLeft > 0 && p.onGround;
  if (!p.ducking) p.duckLeft = Math.min(p.duckLeft, p.onGround ? p.duckLeft : 0);

  // vertical physics
  if (!p.onGround) {
    p.vy += C.GRAVITY * dt;
    p.y += p.vy * dt;
    p.flap += dt * 14;
    if (p.y >= C.GROUND_Y) {
      p.y = C.GROUND_Y; p.vy = 0; p.onGround = true; p.flap = 0;
    }
  } else {
    p.runPhase += dt * (w.speed / 55);
    if (p.duckLeft <= 0) p.duckLeft = 0;
  }
  p.coyote = p.onGround ? C.COYOTE_TIME : Math.max(0, p.coyote - dt);

  // scroll + spawn
  w.spawnTimer -= dt;
  if (w.spawnTimer <= 0) {
    spawnHazard(w);
    if (w.rng() < 0.55) spawnCorn(w);
    w.spawnTimer = Math.max(C.SPAWN_MIN, C.SPAWN_BASE - (w.level - 1) * C.SPAWN_PER_LEVEL) * (0.75 + w.rng() * 0.5);
  }

  const pb = playerBox(w);

  // hazards
  for (const h of w.hazards) {
    h.x -= w.speed * dt;
    if (h.kind === 'knife') h.x -= 120 * dt; // knives fly faster
    if (h.kind === 'oven') {
      h.roll += w.speed * dt / (C.OVEN_W / 2);
      if (w.rng() < dt * 6) w.puffs.push({ x: h.x + h.w / 2, y: h.y - 6, r: 8 + w.rng() * 6, a: 0.5, vx: -30 - w.rng() * 40, vy: -40 - w.rng() * 30 });
    }
    if (!h.missBonusGiven && h.x + h.w < pb.x - 4) {
      h.missBonusGiven = true;
      const dy = Math.abs((pb.y + pb.h / 2) - (h.y + h.h / 2));
      if (dy < C.NEAR_MISS_DIST && dy > 0) { w.score += C.NEAR_MISS_SCORE; h.missBonusGiven = 'near'; }
    }
    if (rectsOverlap(pb, h)) return endRun(w);
  }
  w.hazards = w.hazards.filter((h) => h.x > -160);

  // corn
  for (const c of w.corns) {
    c.x -= w.speed * dt;
    c.phase += dt * 3;
    if (!c.taken) {
      const cx = pb.x + pb.w / 2, cy = pb.y + pb.h / 2;
      const dx = cx - c.x, dy = cy - c.y;
      if (Math.hypot(dx, dy) < C.CORN_R + 34) { c.taken = true; w.corn += 1; w.score += C.CORN_SCORE; }
    }
  }
  w.corns = w.corns.filter((c) => c.x > -60 && !c.gone);
  for (const c of w.corns) if (c.taken && c.gone !== true) c.gone = true;

  // smoke puffs
  for (const s of w.puffs) { s.x += s.vx * dt - w.speed * dt * 0.3; s.y += s.vy * dt; s.a -= dt * 0.6; s.r += dt * 14; }
  w.puffs = w.puffs.filter((s) => s.a > 0);

  // score from distance
  w.score += (w.speed * dt) / C.METER_PX * C.SCORE_PER_M;
}

export function endRun(w) {
  w.screen = SCREEN.OVER;
  w.score = Math.floor(w.score);
  if (w.score > w.best) {
    w.best = w.score;
    try { localStorage.setItem('gobbleRunBest', String(w.best)); } catch (e) { /* private mode */ }
  }
}

export function metersRun(w) { return Math.floor(w.distancePx / C.METER_PX); }
