'use strict';

/* Midnight Vault — sight rules shared by guards and cameras.
   A watcher sees the thief only when the thief is inside its cone,
   within range, with a clear line of sight, and not hidden in smoke. */

function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const blocker of blockers) {
    if (segmentIntersectsRect(x1, y1, x2, y2, blocker)) return false;
  }
  return true;
}

function thiefHiddenBySmoke(thiefX, thiefY, smokes) {
  for (const smoke of smokes) {
    if (distanceBetween(thiefX, thiefY, smoke.x, smoke.y) <= smoke.radius) return true;
  }
  return false;
}

/* Full vision test for one watcher (guard or camera). */
function watcherSeesThief(watcher, thiefX, thiefY, blockers, smokes) {
  const dist = distanceBetween(watcher.x, watcher.y, thiefX, thiefY);
  if (dist > watcher.range) return false;
  const angleToThief = Math.atan2(thiefY - watcher.y, thiefX - watcher.x);
  if (angleDifference(angleToThief, watcher.angle) > watcher.halfAngle) return false;
  if (thiefHiddenBySmoke(thiefX, thiefY, smokes)) return false;
  return hasLineOfSight(watcher.x, watcher.y, thiefX, thiefY, blockers);
}

/* The wedge a watcher can see, as a canvas path, for rendering. */
function traceVisionCone(ctx, watcher) {
  const steps = 24;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  for (let i = 0; i <= steps; i++) {
    const a = watcher.angle - watcher.halfAngle +
      (2 * watcher.halfAngle * i) / steps;
    ctx.lineTo(
      watcher.x + Math.cos(a) * watcher.range,
      watcher.y + Math.sin(a) * watcher.range
    );
  }
  ctx.closePath();
}
