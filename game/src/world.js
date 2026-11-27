// Gobble Run's rules and state — no drawing, no browser. The turkey sprints
// right at a constant clip; the farmer chases from behind. Hazards scroll in:
// rolling ovens, flying carving knives, planted pitchforks. Corn cobs give
// bonus score. One hit and the farmer catches up: the run ends. step() advances
// one fixed step and returns event bit flags.

import { CHASER, CORN, FIELD, HAZARD, LIVES, RUNNER, SCORE, TIMING } from './config.js';
import { randomRange } from './random.js';

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_NEAR_MISS = 4;
export const EVENT_OVER = 8;
export const EVENT_LEVEL_UP = 16;

const HAZARD_KINDS = ['oven', 'knife', 'pitchfork'];

export function createWorld(next) {
  const state = {
    runner: {
      x: RUNNER.x, y: FIELD.groundY - RUNNER.runHeight,
      width: RUNNER.width, height: RUNNER.runHeight,
      vy: 0, onGround: true, ducking: false,
      coyote: 0, jumpBuffered: 0, runPhase: 0,
    },
    chaser: { x: RUNNER.x - CHASER.gapStart, swing: 0 },
    hazards: [], corns: [],
    distance: 0, score: 0, cornCount: 0, level: 1, lives: LIVES,
    hazardTimer: 1.2, cornTimer: 2.0, levelTimer: 0,
    elapsed: 0, nearMisses: 0, shakeT: 0,
    over: false,
  };

  function reset() {
    const r = state.runner;
    r.y = FIELD.groundY - RUNNER.runHeight; r.vy = 0; r.onGround = true;
    r.ducking = false; r.coyote = 0; r.jumpBuffered = 0;
    state.chaser.x = RUNNER.x - CHASER.gapStart;
    state.hazards.length = 0; state.corns.length = 0;
    state.distance = 0; state.score = 0; state.cornCount = 0;
    state.level = 1; state.lives = LIVES;
    state.hazardTimer = 1.2; state.cornTimer = 2.0; state.levelTimer = 0;
    state.elapsed = 0; state.nearMisses = 0; state.shakeT = 0;
    state.over = false;
  }

  function spawnHazard() {
    // Level gates kinds: 1-2 ovens, 3-5 +knives, 6+ +pitchforks; later levels
    // also spawn pairs.
    const kinds = state.level < 3 ? ['oven']
      : state.level < 6 ? ['oven', 'knife']
      : HAZARD_KINDS;
    const kind = kinds[Math.floor(next() * kinds.length)];
    const spec = HAZARD[kind];
    const h = {
      kind, width: spec.width, height: spec.height,
      x: FIELD.width + 60, y: FIELD.groundY - spec.height,
      speed: spec.speed + state.level * 14,
      rollPhase: 0, scored: false, dodged: false,
    };
    if (kind === 'knife') h.y = FIELD.groundY - 78; // chest height: duck or jump under/over
    state.hazards.push(h);
    // Late levels sometimes send a pair.
    if (state.level >= 5 && next() < 0.3) {
      const kind2 = kinds[Math.floor(next() * kinds.length)];
      const s2 = HAZARD[kind2];
      const h2 = { kind: kind2, width: s2.width, height: s2.height,
        x: FIELD.width + 60 + 150 + randomRange(next, -40, 40),
        y: kind2 === 'knife' ? FIELD.groundY - 78 : FIELD.groundY - s2.height,
        speed: s2.speed + state.level * 14, rollPhase: 0, scored: false, dodged: false };
      state.hazards.push(h2);
    }
  }

  function spawnCorn() {
    const arc = next();
    state.corns.push({
      width: CORN.width, height: CORN.height,
      x: FIELD.width + 40, y: FIELD.groundY - 60 - arc * 180,
      taken: false,
    });
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function runnerBox() {
    const r = state.runner;
    const h = r.ducking && r.onGround ? RUNNER.duckHeight : RUNNER.runHeight;
    return { x: r.x + 6, y: FIELD.groundY - h, width: r.width - 12, height: h };
  }

  // Returns a bitmask of EVENT_* flags for this step.
  function step(dt, input) {
    if (state.over) return 0;
    const events = 0;
    let ev = 0;
    const r = state.runner;

    state.elapsed += dt;
    const scroll = FIELD.scrollSpeed + state.level * 26;
    state.distance += scroll * dt;
    state.score += SCORE.perSecond * dt * (1 + state.level * 0.15);
    if (state.shakeT > 0) state.shakeT -= dt;

    // Level clock.
    state.levelTimer += dt;
    if (state.levelTimer >= TIMING.levelEvery && state.level < TIMING.maxLevel) {
      state.levelTimer = 0; state.level += 1; ev |= EVENT_LEVEL_UP;
    }

    // Runner vertical physics.
    r.runPhase += dt * (r.onGround ? 14 : 4);
    if (r.onGround) r.coyote = RUNNER.coyoteTime;
    else r.coyote -= dt;
    r.jumpBuffered -= dt;
    if (input & 1) r.jumpBuffered = RUNNER.jumpBuffer; // ACTION_JUMP bit
    r.ducking = (input & 2) !== 0 && r.onGround;       // ACTION_DUCK bit
    if (r.jumpBuffered > 0 && r.coyote > 0) {
      r.vy = RUNNER.jumpVelocity; r.onGround = false;
      r.coyote = 0; r.jumpBuffered = 0;
    }
    if (!r.onGround) {
      r.vy += RUNNER.gravity * dt;
      r.y += r.vy * dt;
      if (r.y >= FIELD.groundY - RUNNER.runHeight) {
        r.y = FIELD.groundY - RUNNER.runHeight; r.vy = 0; r.onGround = true;
      }
    }

    // Chaser: drifts closer on every dodged hazard burst, keeps min gap.
    state.chaser.swing += dt * 6;
    const target = Math.max(CHASER.minGap, CHASER.gapStart - state.nearMisses * 2.2);
    const wanted = RUNNER.x - target + Math.sin(state.chaser.swing) * 10;
    state.chaser.x += (wanted - state.chaser.x) * Math.min(1, dt * 3);

    // Spawns.
    state.hazardTimer -= dt;
    if (state.hazardTimer <= 0) {
      spawnHazard();
      const gap = TIMING.hazardMinGap * Math.pow(TIMING.hazardGapDecay, state.level - 1);
      state.hazardTimer = gap * randomRange(next, 0.8, 1.35);
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) { spawnCorn(); state.cornTimer = TIMING.cornInterval * randomRange(next, 0.7, 1.3); }

    // Move hazards (their world speed + the scroll speed), corn scrolls too.
    const box = runnerBox();
    for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
      const h = state.hazards[i];
      h.x -= (scroll + h.speed) * dt;
      if (h.kind === 'oven') h.rollPhase += dt * 9;
      if (!h.dodged && h.x + h.width < box.x) { h.dodged = true; state.score += SCORE.nearMiss; state.nearMisses += 1; ev |= EVENT_NEAR_MISS; }
      if (overlaps(box, h)) {
        state.over = true; ev |= EVENT_OVER | EVENT_HIT;
        return ev;
      }
      if (h.x < -100) state.hazards.splice(i, 1);
    }
    for (let i = state.corns.length - 1; i >= 0; i -= 1) {
      const c = state.corns[i];
      c.x -= scroll * dt;
      if (!c.taken && overlaps(box, c)) {
        c.taken = true; state.cornCount += 1;
        state.score += SCORE.perCorn; ev |= EVENT_CORN;
      }
      if (c.taken || c.x < -60) state.corns.splice(i, 1);
    }

    return ev;
  }

  return { state, reset, step };
}
