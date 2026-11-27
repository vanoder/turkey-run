// Boot, fixed-step loop, screen transitions, screenshot hooks.
import * as C from './config.js';
import { createInput } from './input.js';
import { createWorld, startRun, stepWorld, SCREEN, endRun } from './world.js';
import { draw } from './render.js';

const params = new URLSearchParams(location.search);
const seedParam = params.has('seed') ? Number(params.get('seed')) || 12345 : 12345;
const shotMode = params.get('shot') || null;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = C.VIEW_W;
canvas.height = C.VIEW_H;

function resize() {
  const scale = Math.min(window.innerWidth / C.VIEW_W, window.innerHeight / C.VIEW_H);
  canvas.style.width = `${C.VIEW_W * scale}px`;
  canvas.style.height = `${C.VIEW_H * scale}px`;
  canvas.style.position = 'absolute';
  canvas.style.left = `${(window.innerWidth - C.VIEW_W * scale) / 2}px`;
  canvas.style.top = `${(window.innerHeight - C.VIEW_H * scale) / 2}px`;
}
window.addEventListener('resize', resize);
resize();

const input = createInput();
const world = createWorld(seedParam);

let acc = 0;
let last = performance.now();
const STEP = 1 / 120;
let scriptedQueue = []; // actions to inject for ?shot=play

function frame(now) {
  let dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= STEP) {
    acc -= STEP;
    tick(STEP);
  }
  draw(ctx, world, input);
  requestAnimationFrame(frame);
}

function tick(dt) {
  if (shotMode === 'play' && scriptedQueue.length) {
    const a = scriptedQueue.shift();
    stepWorld(world, dt, input, a);
    return;
  }
  input.tick(dt);
  if (input.consumePause()) {
    if (world.screen === SCREEN.PLAY) world.screen = SCREEN.PAUSE;
    else if (world.screen === SCREEN.PAUSE) world.screen = SCREEN.PLAY;
    else if (world.screen === SCREEN.TITLE) startRun(world);
  }
  if (world.screen === SCREEN.TITLE || world.screen === SCREEN.OVER) {
    if (input.consumeConfirm()) startRun(world);
    world.time += dt; // idle animations on menus
    return;
  }
  if (world.screen === SCREEN.PAUSE) return;
  stepWorld(world, dt, input);
}

requestAnimationFrame(frame);

// ---------- screenshot hooks ----------
function paintTwiceThenReady() {
  draw(ctx, world, input);
  draw(ctx, world, input);
  window.__shotReady = true;
}

if (shotMode === 'start') {
  world.screen = SCREEN.TITLE;
  world.time = 1.3; // settle idle pulse
  paintTwiceThenReady();
} else if (shotMode === 'play') {
  // Fast-forward a scripted run: jump over an oven, duck a knife, grab corn,
  // farmer crept in. Scripted actions consumed per physics step.
  startRun(world);
  // Simulate a warm-up period by stepping quickly
  const script = [];
  for (let i = 0; i < 260; i++) script.push({});
  script.push({ jump: true });
  for (let i = 0; i < 130; i++) script.push({});
  script.push({ jump: true });
  for (let i = 0; i < 110; i++) script.push({}); // in the air here
  script.push({ duck: true });
  for (let i = 0; i < 90; i++) script.push({});
  script.push({ jump: true });
  for (let i = 0; i < 600; i++) script.push({});
  scriptedQueue = script;
  // run the whole scripted sequence synchronously
  for (const a of script) stepWorld(world, STEP, input, a);
  scriptedQueue = [];
  // The scripted run may have ended in a catch; restore a live mid-jump chase frame.
  world.screen = SCREEN.PLAY;
  world.farmer.x = C.FARMER_X_FAR + (C.FARMER_X_NEAR - C.FARMER_X_FAR) * 0.45;
  world.farmerMeter = 0.45;
  if (!world.hazards.length) {
    world.hazards.push(
      { kind: 'oven', x: 760, y: C.GROUND_Y - C.OVEN_H, w: C.OVEN_W, h: C.OVEN_H, roll: 2.0, missBonusGiven: true },
      { kind: 'knife', x: 520, y: C.KNIFE_Y, w: C.KNIFE_W, h: C.KNIFE_H, roll: 0.4, missBonusGiven: true },
      { kind: 'pitch', x: 1060, y: C.GROUND_Y - C.PITCH_H, w: C.PITCH_W, h: C.PITCH_H, roll: 0, missBonusGiven: true },
    );
    world.corns.push({ x: 620, y: C.GROUND_Y - 160, phase: 0.6, taken: false });
  }
  world.player.onGround = false;
  world.player.vy = -420;
  world.player.y = C.GROUND_Y - 90;
  paintTwiceThenReady();
} else if (shotMode === 'end') {
  startRun(world);
  world.distancePx = 4120 * C.METER_PX;
  world.score = 4386;
  world.corn = 9;
  world.time = 71;
  world.level = 4;
  world.farmer.x = C.FARMER_X_FAR + (C.FARMER_X_NEAR - C.FARMER_X_FAR) * 0.92;
  world.farmerMeter = 0.92;
  // scatter a few hazards/corns for scenery
  world.hazards.push(
    { kind: 'oven', x: 980, y: C.GROUND_Y - C.OVEN_H, w: C.OVEN_W, h: C.OVEN_H, roll: 1.2, missBonusGiven: true },
    { kind: 'knife', x: 640, y: C.KNIFE_Y, w: C.KNIFE_W, h: C.KNIFE_H, roll: 0.4, missBonusGiven: true },
    { kind: 'pitch', x: 1180, y: C.GROUND_Y - C.PITCH_H, w: C.PITCH_W, h: C.PITCH_H, roll: 0, missBonusGiven: true },
  );
  world.corns.push({ x: 420, y: C.GROUND_Y - 170, phase: 0.4, taken: false });
  world.corns.push({ x: 860, y: C.GROUND_Y - 90, phase: 2.1, taken: false });
  endRun(world);
  paintTwiceThenReady();
}
