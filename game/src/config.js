// GOBBLE RUN — all tuning constants in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const GROUND_Y = 620;          // top of dirt ground
export const PLAYER_X = 240;          // fixed screen x of the turkey

// Physics (per second)
export const GRAVITY = 2400;
export const JUMP_VY = -880;
export const COYOTE_TIME = 0.09;      // s of grace after leaving ground
export const JUMP_BUFFER = 0.12;      // s early-press forgiveness
export const DUCK_TIME = 0.35;        // s of forced duck after a duck press

// Player sizes (hitbox)
export const STAND_W = 56, STAND_H = 78;
export const DUCK_W = 76, DUCK_H = 46;

// Farmer chase
export const FARMER_X_FAR = 40;       // screen x when fully behind
export const FARMER_X_NEAR = 190;     // screen x when caught
export const FARMER_CREEP = 7;        // px/s he creeps closer
export const FARMER_CATCH = 24;       // farmer within this of player = caught

// Scroll / levels
export const LEVEL_TIME = 22;         // s per level
export const MAX_LEVEL = 9;
export const BASE_SPEED = 380;        // px/s at level 1
export const SPEED_PER_LEVEL = 55;
export const SPAWN_BASE = 1.5;        // s between spawns at level 1
export const SPAWN_MIN = 0.55;
export const SPAWN_PER_LEVEL = 0.11;

// Hazards
export const OVEN_W = 96, OVEN_H = 74;
export const KNIFE_W = 84, KNIFE_H = 22;
export const KNIFE_Y = GROUND_Y - 96; // chest height
export const PITCH_W = 26, PITCH_H = 92;
export const PAIR_CHANCE_MIN_LEVEL = 4;

// Corn
export const CORN_SCORE = 150;
export const CORN_R = 20;             // pickup radius
export const NEAR_MISS_DIST = 90;     // px of a hazard for a near-miss
export const NEAR_MISS_SCORE = 25;

// Scoring
export const SCORE_PER_M = 1.0;       // meters are distance/10
export const METER_PX = 10;

// Palette — dusk farm
export const PAL = {
  skyTop: '#2b1b4e',
  skyMid: '#6b3f6e',
  skyLow: '#c96a4e',
  sun: '#ffd98a',
  hillFar: '#3a2b52',
  hillNear: '#2c2140',
  barn: '#a03a30',
  barnDark: '#7d2a24',
  roof: '#4a2338',
  silo: '#8a8f9e',
  fence: '#5a3d2b',
  dirt: '#6e4a2f',
  dirtDark: '#553722',
  grass: '#4d5a2e',
  turkeyBody: '#7a4326',
  turkeyDark: '#5d3018',
  turkeyTail: '#c95a33',
  turkeyBeak: '#e8a33d',
  turkeyWattle: '#d33a3a',
  farmerSkin: '#d9a06b',
  farmerShirt: '#3f6ea5',
  farmerOveralls: '#3a5a3a',
  farmerHat: '#c8a24a',
  metal: '#cfd4dc',
  oven: '#3d3d44',
  corn: '#f2c53d',
};
