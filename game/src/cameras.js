'use strict';

/* Midnight Vault — wall-mounted security cameras.
   Each camera sweeps its cone back and forth on a fixed rhythm.
   A camera never chases, but being caught in its cone fills the
   alarm meter, and its red sweep is the room's metronome. */

function createCamera(def) {
  return {
    name: def.name,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    periodSeconds: def.periodSeconds,
    phase: Math.random() * Math.PI * 2,
    angle: def.baseAngle,
    range: TUNING.cameraVisionRange,
    halfAngle: TUNING.cameraVisionHalfAngle,
    blinkTimer: 0,
    blinkOn: true,
  };
}

function updateCamera(camera, dt, elapsedSeconds) {
  const t = (elapsedSeconds / camera.periodSeconds) * Math.PI * 2 + camera.phase;
  camera.angle = camera.baseAngle + Math.sin(t) * camera.sweep;
  camera.blinkTimer += dt;
  if (camera.blinkTimer > 0.6) {
    camera.blinkTimer = 0;
    camera.blinkOn = !camera.blinkOn;
  }
}
