// Tiny deterministic PRNG (mulberry32). A run's seed drives hazard spawns so
// runs are reproducible from a seed while feeling varied.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomRange(next, lo, hi) {
  return lo + next() * (hi - lo);
}
