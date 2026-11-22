'use strict';

/* Midnight Vault — guard patrol, suspicion and pursuit.
   A guard walks its waypoints, turns to investigate a coin's clink,
   and chases the thief while it can see them. Getting touched by a
   guard ends the run; being seen fills the alarm meter. */

function createGuard(def) {
  return {
    name: def.name,
    x: def.startX,
    y: def.startY,
    waypoints: def.waypoints,
    waypointIndex: 1,
    speed: def.speed,
    angle: 0,
    state: 'patrol', /* patrol | investigate | chase */
    investigateX: 0,
    investigateY: 0,
    investigateTimer: 0,
    lookTimer: 0,
    seenTimer: 0,
    range: TUNING.guardVisionRange,
    halfAngle: TUNING.guardVisionHalfAngle,
    radius: TUNING.guardRadius,
  };
}

function moveGuardToward(guard, targetX, targetY, speed, dt) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

/* A coin landing nearby pulls every guard in earshot to look. */
function lureGuardsToCoin(guards, coinX, coinY) {
  for (const guard of guards) {
    if (distanceBetween(guard.x, guard.y, coinX, coinY) <= TUNING.coinLureRadius) {
      guard.state = 'investigate';
      guard.investigateX = coinX;
      guard.investigateY = coinY;
      guard.investigateTimer = TUNING.investigateDuration;
      guard.lookTimer = 0;
    }
  }
}

function updateGuard(guard, dt, thief, blockers, smokes) {
  const seesThief = watcherSeesThief(guard, thief.x, thief.y, blockers, smokes);
  if (seesThief) {
    guard.seenTimer = 0.4;
    if (guard.state !== 'chase') guard.state = 'chase';
  } else if (guard.seenTimer > 0) {
    guard.seenTimer -= dt;
  }

  if (guard.state === 'chase') {
    if (seesThief) {
      moveGuardToward(guard, thief.x, thief.y, TUNING.guardChaseSpeed, dt);
    } else if (guard.seenTimer <= 0) {
      /* Lost the thief: go back to the patrol route. */
      guard.state = 'patrol';
    } else {
      /* Keep pushing to the last seen spot for a beat. */
      moveGuardToward(guard, thief.x, thief.y, TUNING.guardChaseSpeed, dt);
    }
    return seesThief;
  }

  if (guard.state === 'investigate') {
    const arrived = moveGuardToward(
      guard, guard.investigateX, guard.investigateY, guard.speed * 1.35, dt
    );
    if (arrived) {
      guard.lookTimer += dt;
      /* Look around at the noise, then give up and patrol on. */
      guard.angle += dt * 2.4;
      if (guard.lookTimer > 2) {
        guard.state = 'patrol';
        guard.lookTimer = 0;
      }
    }
    guard.investigateTimer -= dt;
    if (guard.investigateTimer <= 0 && guard.state === 'investigate') {
      guard.state = 'patrol';
    }
    return seesThief;
  }

  /* Patrol: walk the waypoints back and forth. */
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveGuardToward(guard, target.x, target.y, guard.speed, dt);
  if (arrived) {
    guard.waypointIndex += 1;
    if (guard.waypointIndex >= guard.waypoints.length) guard.waypointIndex = 0;
  }
  return seesThief;
}
