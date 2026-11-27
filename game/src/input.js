// Keyboard + pointer input for Gobble Run. Produces two signals the world reads:
//   direction(): horizontal nudge (-1 / 0 / +1) from A/D or arrows
// plus an action bitmask consumed via takeActions(): JUMP (space / up / W / click /
// tap upper half), DUCK (S / down / touch lower half), CONFIRM, PAUSE (P / Escape).
// Keys remember a short jump buffer handled by the world, not here.

export const ACTION_JUMP = 1;
export const ACTION_DUCK = 2;
export const ACTION_CONFIRM = 4;
export const ACTION_PAUSE = 8;

export function createInput(canvas) {
  const held = new Set();
  const actions = [];
  let duckHeld = false;

  const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
  const DUCK_KEYS = ['ArrowDown', 'KeyS'];
  const CONFIRM_KEYS = ['Space', 'Enter'];
  const PAUSE_KEYS = ['KeyP', 'Escape'];

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    held.add(e.code);
    if (JUMP_KEYS.includes(e.code)) actions.push(ACTION_JUMP);
    if (DUCK_KEYS.includes(e.code)) actions.push(ACTION_DUCK);
    if (CONFIRM_KEYS.includes(e.code)) actions.push(ACTION_CONFIRM);
    if (PAUSE_KEYS.includes(e.code)) actions.push(ACTION_PAUSE);
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
    if (DUCK_KEYS.includes(e.code)) duckHeld = false;
  });

  // Pointer: left half = jump, right half = duck (works with mouse and touch).
  function pointer(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    if (x < rect.width * 0.5) actions.push(ACTION_JUMP | ACTION_CONFIRM);
    else { actions.push(ACTION_DUCK); duckHeld = true; }
  }
  canvas.addEventListener('pointerdown', pointer);
  window.addEventListener('pointerup', () => { duckHeld = false; });

  return {
    // -1, 0 or +1: A/Left vs D/Right (keyboard) only; pointer handles the rest.
    direction() {
      let d = 0;
      if (held.has('ArrowLeft') || held.has('KeyA')) d -= 1;
      if (held.has('ArrowRight') || held.has('KeyD')) d += 1;
      return d;
    },
    ducking() { return duckHeld || held.has('ArrowDown') || held.has('KeyS'); },
    takeActions() {
      const out = actions.reduce((a, b) => a | b, 0);
      actions.length = 0;
      return out;
    },
  };
}
