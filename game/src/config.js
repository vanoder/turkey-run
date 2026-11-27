// Tuning knobs for Gobble Run. Every gameplay constant lives here so balance
// changes never touch logic. Values are in CSS pixels and seconds.
export const FIELD = {
  width: 1280,           // virtual world width; the canvas scales to fit
  height: 720,
  groundY: 600,          // y of the ground line the runner stands on
  scrollSpeed: 260,      // base world scroll (px/s)
};

export const RUNNER = {
  width: 44,
  height: 48,
  x: 240,               // fixed screen x of the turkey
  jumpVelocity: -640,   // initial jump impulse (px/s)
  gravity: 1750,        // px/s^2
  duckHeight: 28,       // hitbox height while ducking
  runHeight: 48,
  coyoteTime: 0.09,     // s of jump grace after leaving ground
  jumpBuffer: 0.12,     // s a jump press is remembered before landing
};

export const CHASER = {
  width: 60,
  height: 74,
  gapStart: 210,        // px behind the runner at the start
  minGap: 120,          // never closer than this
  catchSpeed: 34,       // extra px/s the farmer gains per missed hazard
};

export const HAZARD = {
  oven:   { width: 66, height: 58, speed: 0 },     // ground hazard: roll toward player
  knife:  { width: 46, height: 26, speed: 190 },   // flies at chest height
  pitchfork: { width: 30, height: 62, speed: 0 },  // tall ground obstacle
};

export const CORN = { width: 26, height: 26 };

export const TIMING = {
  step: 1 / 120,            // fixed physics step (s)
  hazardMinGap: 0.85,       // s between hazard spawns at level 1
  hazardGapDecay: 0.93,     // gap multiplier per level
  cornInterval: 3.4,        // s between corn spawns
  levelEvery: 22,           // s per level up
  maxLevel: 9,
};

export const SCORE = {
  perSecond: 10,            // distance score per second
  perCorn: 150,
  nearMiss: 40,             // dodged hazard bonus
};

export const LIVES = 1;      // one hit ends the run (arcade chase logic)

export const BEST_KEY = 'gobble-run-best'; // localStorage key for the best score

export const STEP = TIMING.step; // the fixed physics step the loop advances by
