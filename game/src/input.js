'use strict';

/* Midnight Vault — keyboard and mouse input.
   Movement is WASD or arrows; a mouse click throws a coin at the
   clicked floor point; Q drops a smoke pellet; M mutes the sound. */

const Input = {
  keys: {},
  mouse: { x: 0, y: 0, inside: false },
  clicks: [],

  init(canvas) {
    window.addEventListener('keydown', (event) => {
      const code = event.code;
      if (code === 'ArrowUp' || code === 'ArrowDown' ||
          code === 'ArrowLeft' || code === 'ArrowRight' ||
          code === 'Space') {
        event.preventDefault();
      }
      if (!event.repeat) this.keys[code] = true;
    });
    window.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });
    window.addEventListener('blur', () => {
      this.keys = {};
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.inside = true;
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
    });
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);
      this.clicks.push({ x, y, button: event.button });
    });
  },

  isDown() {
    for (let i = 0; i < arguments.length; i++) {
      if (this.keys[arguments[i]]) return true;
    }
    return false;
  },

  /* -1, 0 or 1 on each axis from the movement keys. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyW', 'ArrowUp')) y -= 1;
    if (this.isDown('KeyS', 'ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(2);
      x /= len;
      y /= len;
    }
    return { x, y };
  },

  /* True once for a key pressed since the last frame; consumes it. */
  pressedOnce(code) {
    if (this.keys[code]) {
      this.keys[code] = false;
      return true;
    }
    return false;
  },

  takeClicks() {
    const taken = this.clicks;
    this.clicks = [];
    return taken;
  },
};
