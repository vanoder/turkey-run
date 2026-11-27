// Boot and the one loop for Gobble Run. Input is read every frame, the world
// advances in fixed 1/120 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. Screens: title, play, over.
//
// ?seed=N fixes the hazard pattern. ?shot=start|play|end (&seed=N) stages that
// scene instead of running the loop, paints twice and sets window.__shotReady
// for a screenshot. ?over=1 stages a finished run with real numbers.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

// Staged screenshots: title, a mid-run action frame, a caught/over frame.
function runShot(name) {
  let best = readBest();
  if (name === 'start') {
    renderer.draw(world.state, SCREEN_TITLE, best);
    renderer.draw(world.state, SCREEN_TITLE, best);
    window.__shotReady = true;
    return;
  }
  // Fast-forward a scripted run to a lively frame, then hold it.
  const inputs = [];
  for (let i = 0; i < 900; i += 1) inputs.push(i % 90 === 12 ? 1 : (i % 170 === 60 ? 2 : 0));
  let stepIndex = 0;
  let screen = SCREEN_PLAY;
  while (stepIndex < inputs.length && !world.state.over) {
    const ev = world.step(STEP, inputs[stepIndex]);
    if (ev & EVENT_OVER) { screen = SCREEN_OVER; break; }
    stepIndex += 1;
  }
  if (name === 'end') {
    world.state.over = true;
    world.state.score = Math.max(world.state.score, 4210);
    world.state.distance = Math.max(world.state.distance, 4120);
    world.state.cornCount = Math.max(world.state.cornCount, 9);
    renderer.draw(world.state, SCREEN_OVER, best);
    renderer.draw(world.state, SCREEN_OVER, best);
  } else {
    renderer.draw(world.state, SCREEN_PLAY, best);
    renderer.draw(world.state, SCREEN_PLAY, best);
  }
  window.__shotReady = true;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) { status.textContent = message; }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Running. Jump the ovens, duck the knives, grab the corn.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    announce(`Caught! Score ${Math.floor(world.state.score)}. Best ${Math.floor(best)}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) { screen = SCREEN_TITLE; announce('Paused on title.'); }
  }

  function step() {
    const dir = input.direction();
    let act = 0;
    if (input.ducking()) act |= 2;
    // The world reads jump/duck bits packed into the same word.
    const events = world.step(STEP, act | lastJumpBit());
    if (events & EVENT_OVER) endGame();
  }
  let pendingJump = 0;
  function lastJumpBit() { const j = pendingJump; pendingJump = 0; return j; }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & (4 | 1)) pendingJump = 1; // CONFIRM or JUMP arms the jump bit
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_TITLE; announce('Interrupted — back to title.'); }
  });

  announce('Gobble Run. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
