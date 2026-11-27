// Input: keyboard + pointer/touch -> action bits consumed by world/main.
// jumpPressed (edge), jumpHeld, duckHeld, pausePressed (edge), confirmPressed (edge)

const ACT = { jump: 1, duck: 2 };

export function createInput() {
  const state = {
    jumpHeld: false,
    duckHeld: false,
    jumpEdge: false,     // set on press, cleared by consumer
    pauseEdge: false,
    confirmEdge: false,  // jump press that should also confirm menus
    jumpBuffer: 0,       // seconds remaining on buffered jump
  };

  function pressJump() {
    state.jumpHeld = true;
    state.jumpEdge = true;
    state.confirmEdge = true;
    state.jumpBuffer = 0.12;
  }
  function releaseJump() { state.jumpHeld = false; }
  function pressDuck() { state.duckHeld = true; }
  function releaseDuck() { state.duckHeld = false; }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
      e.preventDefault(); pressJump();
    } else if (k === 'ArrowDown' || k === 'KeyS') {
      e.preventDefault(); pressDuck();
    } else if (k === 'KeyP' || k === 'Escape') {
      state.pauseEdge = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') releaseJump();
    else if (k === 'ArrowDown' || k === 'KeyS') releaseDuck();
  });

  window.addEventListener('pointerdown', (e) => {
    const half = e.clientX < window.innerWidth / 2 ? 'left' : 'right';
    if (half === 'left') pressJump(); else pressDuck();
  });
  window.addEventListener('pointerup', () => releaseJump());

  // Touch-friendly: releasing on the right half shouldn't hang duck
  window.addEventListener('pointerleave', () => { releaseJump(); releaseDuck(); });
  window.addEventListener('blur', () => { releaseJump(); releaseDuck(); });

  return {
    state,
    consumeJump() { const v = state.jumpEdge; state.jumpEdge = false; return v; },
    consumeConfirm() { const v = state.confirmEdge; state.confirmEdge = false; return v; },
    consumePause() { const v = state.pauseEdge; state.pauseEdge = false; return v; },
    tick(dt) { state.jumpBuffer = Math.max(0, state.jumpBuffer - dt); },
  };
}
