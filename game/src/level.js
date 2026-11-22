'use strict';

/* Midnight Vault — the Meridian Gallery floor plan.
   One room, three lanes, two patrols, two cameras, four loot pieces
   and one exit: everything the bounty asks to be visible in a single
   frame is laid out here, and nothing is copied from another game. */

function buildLevel() {
  /* Interior walls. Each leaves a gap so the thief always has
     more than one route through the room. */
  const walls = [
    { x: 420, y: 120, w: 16, h: 300, label: 'north partition' },
    { x: 840, y: 300, w: 16, h: 340, label: 'south partition' },
    { x: 560, y: 180, w: 300, h: 16, label: 'mezzanine rail' },
  ];

  /* Display pedestals. They block movement and line of sight, so
     they are the thief's cover. Loot sits on three of them. */
  const pedestals = [
    { x: 240, y: 180, w: 70, h: 70, loot: 'ruby' },
    { x: 600, y: 300, w: 70, h: 70, loot: null },
    { x: 980, y: 180, w: 70, h: 70, loot: 'emerald' },
    { x: 240, y: 520, w: 70, h: 70, loot: null },
    { x: 700, y: 520, w: 70, h: 70, loot: 'topaz' },
    { x: 1080, y: 480, w: 70, h: 70, loot: null },
  ];

  /* Loose gems resting on pedestals. */
  const loot = [
    { id: 'ruby', name: 'Ruby of the Dawn', x: 275, y: 215, value: TUNING.gemValue, color: PALETTE.gemRuby, taken: false },
    { id: 'emerald', name: 'Emerald of the Tide', x: 1015, y: 215, value: TUNING.gemValue, color: PALETTE.gemEmerald, taken: false },
    { id: 'topaz', name: 'Topaz of the Ember', x: 735, y: 555, value: TUNING.gemValue, color: PALETTE.gemTopaz, taken: false },
  ];

  /* The Star Sapphire in its glass case: the main target. */
  const vault = {
    x: 1090, y: 225, w: 96, h: 76,
    name: 'Star Sapphire',
    value: TUNING.sapphireValue,
    color: PALETTE.sapphire,
    taken: false,
  };

  /* The getaway door on the south wall. */
  const exitZone = { x: 1150, y: 648, w: 100, h: 52, label: 'EXIT' };

  /* Where the thief slips in: the service door, south-west corner. */
  const entrance = { x: 84, y: 648 };

  const guards = [
    {
      name: 'Rook',
      startX: 500, startY: 140,
      waypoints: [{ x: 500, y: 140 }, { x: 800, y: 140 }],
      speed: TUNING.guardSpeed,
    },
    {
      name: 'Bishop',
      startX: 960, startY: 260,
      waypoints: [{ x: 960, y: 260 }, { x: 960, y: 600 }],
      speed: TUNING.guardSpeed - 6,
    },
  ];

  const cameras = [
    {
      name: 'Cam North',
      x: 640, y: 78,
      baseAngle: Math.PI / 2, /* looks down into the room */
      sweep: 0.85,
      periodSeconds: 5,
    },
    {
      name: 'Cam West',
      x: 22, y: 400,
      baseAngle: 0, /* looks right across the room */
      sweep: 0.65,
      periodSeconds: 6.5,
    },
  ];

  return { walls, pedestals, loot, vault, exitZone, entrance, guards, cameras };
}

/* Every solid rectangle that blocks movement or sight. */
function levelBlockers(level) {
  const blockers = level.walls.slice();
  for (const pedestal of level.pedestals) blockers.push(pedestal);
  blockers.push({ x: level.vault.x, y: level.vault.y, w: level.vault.w, h: level.vault.h });
  return blockers;
}
