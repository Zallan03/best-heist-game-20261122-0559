'use strict';

/* Midnight Vault — every pixel the player sees.
   One canvas, drawn in layers: floor, vision cones, walls and cover,
   loot and the vault, actors, then the HUD and the screens. The
   cover screenshot is a single frame of the play layer, so the HUD
   always shows the alarm meter, the loot and the tools. */

function drawFloor(ctx, level) {
  ctx.fillStyle = PALETTE.floorB;
  ctx.fillRect(0, PLAY_BOUNDS.top, GAME_WIDTH, GAME_HEIGHT - PLAY_BOUNDS.top);
  const tile = 64;
  for (let y = PLAY_BOUNDS.top; y < GAME_HEIGHT; y += tile) {
    for (let x = 0; x < GAME_WIDTH; x += tile) {
      const even = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME_WIDTH; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, PLAY_BOUNDS.top); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
  }
  for (let y = PLAY_BOUNDS.top; y <= GAME_HEIGHT; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
  }
  /* The crimson carpet runner from the door to the vault. */
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(880, 240, 300, 90);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(880, 240, 300, 90);
}

function drawWalls(ctx, level) {
  /* Outer frame. */
  ctx.fillStyle = PALETTE.wallFace;
  ctx.fillRect(0, PLAY_BOUNDS.top, GAME_WIDTH, 12);
  ctx.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12);
  ctx.fillRect(0, PLAY_BOUNDS.top, 12, GAME_HEIGHT - PLAY_BOUNDS.top);
  ctx.fillRect(GAME_WIDTH - 12, PLAY_BOUNDS.top, 12, GAME_HEIGHT - PLAY_BOUNDS.top);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, PLAY_BOUNDS.top, GAME_WIDTH, 3);
  ctx.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 3);
  /* Interior partitions. */
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wallFace;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    if (wall.w > wall.h) ctx.fillRect(wall.x, wall.y, wall.w, 3);
    else ctx.fillRect(wall.x, wall.y, 3, wall.h);
  }
}

function drawPedestals(ctx, level) {
  for (const pedestal of level.pedestals) {
    /* Warm spotlight pool on the floor around each pedestal. */
    const glow = ctx.createRadialGradient(
      pedestal.x + pedestal.w / 2, pedestal.y + pedestal.h / 2, 8,
      pedestal.x + pedestal.w / 2, pedestal.y + pedestal.h / 2, 78
    );
    glow.addColorStop(0, 'rgba(255, 214, 120, 0.14)');
    glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(pedestal.x - 50, pedestal.y - 50, pedestal.w + 100, pedestal.h + 100);
    ctx.fillStyle = PALETTE.pedestal;
    ctx.fillRect(pedestal.x, pedestal.y, pedestal.w, pedestal.h);
    ctx.fillStyle = PALETTE.pedestalTop;
    ctx.fillRect(pedestal.x + 4, pedestal.y + 4, pedestal.w - 8, pedestal.h - 8);
    ctx.strokeStyle = PALETTE.pedestalTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(pedestal.x + 4, pedestal.y + 4, pedestal.w - 8, pedestal.h - 8);
  }
}

function drawGem(ctx, x, y, color, radius, pulse) {
  const r = radius * (1 + 0.08 * Math.sin(pulse));
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.8, -r * 0.2);
  ctx.lineTo(r * 0.55, r * 0.8);
  ctx.lineTo(-r * 0.55, r * 0.8);
  ctx.lineTo(-r * 0.8, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.4, -r * 0.2);
  ctx.lineTo(0, r * 0.2);
  ctx.lineTo(-r * 0.4, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLootAndVault(ctx, level, elapsedSeconds) {
  for (const gem of level.loot) {
    if (gem.taken) continue;
    drawGem(ctx, gem.x, gem.y, gem.color, 13, elapsedSeconds * 3 + gem.x);
  }
  const vault = level.vault;
  /* Glass case around the Star Sapphire. */
  ctx.fillStyle = PALETTE.vaultGlass;
  ctx.fillRect(vault.x, vault.y, vault.w, vault.h);
  ctx.strokeStyle = PALETTE.vaultFrame;
  ctx.lineWidth = 3;
  ctx.strokeRect(vault.x, vault.y, vault.w, vault.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(vault.x + 8, vault.y + vault.h - 8);
  ctx.lineTo(vault.x + vault.w - 8, vault.y + 8);
  ctx.stroke();
  if (!vault.taken) {
    drawGem(ctx, vault.x + vault.w / 2, vault.y + vault.h / 2, vault.color, 20, elapsedSeconds * 2);
  }
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STAR SAPPHIRE', vault.x + vault.w / 2, vault.y - 8);
}

function drawExitAndEntrance(ctx, level, elapsedSeconds) {
  const exit = level.exitZone;
  const pulse = 0.6 + 0.4 * Math.sin(elapsedSeconds * 3);
  ctx.fillStyle = PALETTE.exitDoor;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = PALETTE.exitGlow;
  ctx.globalAlpha = pulse;
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 7);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '11px sans-serif';
  ctx.fillText('GETAWAY', exit.x + exit.w / 2, exit.y - 8);
  /* Entrance mat. */
  ctx.fillStyle = PALETTE.entranceMat;
  ctx.fillRect(level.entrance.x - 34, level.entrance.y - 20, 68, 40);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '11px sans-serif';
  ctx.fillText('SERVICE DOOR', level.entrance.x, level.entrance.y + 34);
}

function drawVisionCones(ctx, guards, cameras) {
  for (const camera of cameras) {
    traceVisionCone(ctx, camera);
    ctx.fillStyle = PALETTE.coneCamera;
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneCameraEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (const guard of guards) {
    traceVisionCone(ctx, guard);
    ctx.fillStyle = guard.state === 'chase' ? PALETTE.coneGuardAlert : PALETTE.coneGuard;
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneGuardEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawSmokeAndCoins(ctx, smokes, coins) {
  for (const smoke of smokes) {
    ctx.fillStyle = PALETTE.smokeFill;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 225, 235, 0.20)';
    ctx.beginPath();
    ctx.arc(smoke.x - 18, smoke.y + 10, smoke.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(smoke.x + 20, smoke.y - 12, smoke.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const coin of coins) {
    ctx.fillStyle = PALETTE.coinGold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a1e';
    ctx.lineWidth = 1;
    ctx.stroke();
    /* Ripple ring so the player can see where the noise lands. */
    ctx.strokeStyle = 'rgba(232, 182, 76, 0.5)';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6 + coin.age * 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawThief(ctx, thief) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  /* A faint gold halo so the thief reads at a glance, even when the
     contact sheet shrinks the frame. */
  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 30);
  halo.addColorStop(0, 'rgba(232, 182, 76, 0.30)');
  halo.addColorStop(1, 'rgba(232, 182, 76, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(2, 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  /* Hooded cloak. */
  ctx.fillStyle = PALETTE.thiefCloak;
  ctx.beginPath();
  ctx.arc(0, 0, TUNING.thiefRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a4152';
  ctx.lineWidth = 2;
  ctx.stroke();
  /* Hood point in the facing direction. */
  ctx.rotate(thief.angle);
  ctx.fillStyle = PALETTE.thiefHood;
  ctx.beginPath();
  ctx.moveTo(TUNING.thiefRadius + 6, 0);
  ctx.lineTo(4, -8);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();
  /* Gold mask slit. */
  ctx.fillStyle = PALETTE.thiefMask;
  ctx.fillRect(6, -4, 7, 8);
  ctx.restore();
}

function drawGuard(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(2, 11, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.guardUniform;
  ctx.beginPath();
  ctx.arc(0, 0, TUNING.guardRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = guard.state === 'chase' ? '#ff6b5e' : '#5a6ea8';
  ctx.lineWidth = 2;
  ctx.stroke();
  /* Cap brim in the facing direction. */
  ctx.rotate(guard.angle);
  ctx.fillStyle = PALETTE.guardCap;
  ctx.fillRect(6, -9, 12, 18);
  ctx.fillStyle = PALETTE.guardSkin;
  ctx.beginPath();
  ctx.arc(4, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  /* Name tag above, state marker beside the guard, clear of the
     SPOTTED banner. */
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, guard.x, guard.y - 24);
  ctx.textAlign = 'left';
  if (guard.state === 'chase') {
    ctx.fillStyle = PALETTE.bannerRed;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('!', guard.x + 24, guard.y + 6);
  } else if (guard.state === 'investigate') {
    ctx.fillStyle = PALETTE.titleGold;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('?', guard.x + 24, guard.y + 6);
  }
}

function drawCamera(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = PALETTE.cameraBody;
  ctx.fillRect(-4, -8, 26, 16);
  ctx.fillStyle = camera.blinkOn ? PALETTE.cameraLens : '#7a2020';
  ctx.beginPath();
  ctx.arc(22, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(camera.name, camera.x, camera.y + 26);
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hudBar;
  ctx.fillRect(0, 0, GAME_WIDTH, 56);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, 56, GAME_WIDTH, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.titleGold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('MIDNIGHT VAULT', 18, 24);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '12px sans-serif';
  ctx.fillText('Meridian Gallery — one night, one sapphire', 18, 44);

  /* Alarm meter: the game's heartbeat, dead centre. */
  const alarm = game.alarm;
  const meterX = 470;
  const meterW = 340;
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, 22);
  ctx.fillStyle = '#0a0d13';
  ctx.fillRect(meterX, 28, meterW, 16);
  const alarmColor = alarm < 40 ? PALETTE.alarmSafe :
    alarm < 75 ? PALETTE.alarmWarm : PALETTE.alarmHot;
  ctx.fillStyle = alarmColor;
  ctx.fillRect(meterX, 28, meterW * (alarm / 100), 16);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX, 28, meterW, 16);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(Math.round(alarm) + '%', meterX + meterW + 10, 41);

  /* Loot, tools and timer on the right. */
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('LOOT $' + game.lootValue + '  (' + game.lootTaken + '/4)', 1080, 24);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText('SMOKE x' + game.smokeLeft + '   COIN x' + game.coinsLeft, 1080, 44);
  const seconds = Math.max(0, Math.ceil(game.timeLeft));
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  ctx.fillStyle = seconds <= 30 ? PALETTE.alarmHot : PALETTE.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(mm + ':' + ss, 1252, 30);
}

function drawHintBar(ctx) {
  ctx.fillStyle = 'rgba(10, 13, 19, 0.75)';
  ctx.fillRect(0, GAME_HEIGHT - 24, GAME_WIDTH, 24);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows — move      Click — throw a coin      Q — smoke pellet      M — mute', GAME_WIDTH / 2, GAME_HEIGHT - 8);
}

function drawSpottedBanner(ctx, game) {
  if (game.spottedFlash <= 0) return;
  const alpha = clamp(game.spottedFlash / 0.6, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.bannerRed;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPOTTED!', GAME_WIDTH / 2, 150);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Break line of sight — the alarm is climbing!', GAME_WIDTH / 2, 182);
  ctx.restore();
}

function drawTitleScreen(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.88)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.titleGold;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('MIDNIGHT VAULT', GAME_WIDTH / 2, 170);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '22px sans-serif';
  ctx.fillText('A one-room gallery heist — in, out, and never seen', GAME_WIDTH / 2, 212);
  ctx.strokeStyle = PALETTE.titleGold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(GAME_WIDTH / 2 - 260, 240);
  ctx.lineTo(GAME_WIDTH / 2 + 260, 240);
  ctx.stroke();

  const lines = [
    'Steal the Star Sapphire from its glass case — and the three gems on the pedestals.',
    'Guards patrol with sweeping vision cones. Cameras sweep the room in red.',
    'Seen by a guard or a camera, the ALARM climbs. At 100% the night is over.',
    'Throw a coin (click) to lure a guard away. Drop smoke (Q) to vanish from sight.',
    'Grab the sapphire, then slip out through the green EXIT door before time runs out.',
  ];
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#c9d2e4';
  lines.forEach((line, i) => ctx.fillText(line, GAME_WIDTH / 2, 290 + i * 30));

  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '15px sans-serif';
  ctx.fillText('Move: WASD or arrow keys      Coin: mouse click      Smoke: Q      Mute: M', GAME_WIDTH / 2, 480);
  const blink = 0.55 + 0.45 * Math.sin(Date.now() / 300);
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press ENTER or click to begin the heist', GAME_WIDTH / 2, 540);
  ctx.restore();
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '12px sans-serif';
  ctx.fillText('An original game — its art, sounds and code were made for this bounty.', GAME_WIDTH / 2, 640);
}

function drawEndScreen(ctx, game) {
  ctx.fillStyle = 'rgba(8, 10, 16, 0.85)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.textAlign = 'center';
  if (game.state === 'win') {
    ctx.fillStyle = PALETTE.exitGlow;
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText('CLEAN GETAWAY!', GAME_WIDTH / 2, 180);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '20px sans-serif';
    ctx.fillText('The Star Sapphire is yours. The gallery never knew you were there.', GAME_WIDTH / 2, 222);
  } else {
    ctx.fillStyle = PALETTE.bannerRed;
    ctx.font = 'bold 58px sans-serif';
    const title = game.loseReason === 'caught' ? 'CAUGHT RED-HANDED!' :
      game.loseReason === 'alarm' ? 'ALARM TRIPPED!' : 'THE VAULT SEALED!';
    ctx.fillText(title, GAME_WIDTH / 2, 180);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '20px sans-serif';
    const reason = game.loseReason === 'caught' ? 'A guard laid hands on you in the gallery.' :
      game.loseReason === 'alarm' ? 'The alarm hit 100% and the doors locked down.' :
        'The night ran out before you reached the exit.';
    ctx.fillText(reason, GAME_WIDTH / 2, 222);
  }
  const rows = [
    ['Loot taken', '$' + game.lootValue],
    ['Time bonus', '$' + game.timeBonus],
    ['Alarm penalty', '-$' + game.alarmPenalty],
    ['FINAL SCORE', '$' + game.finalScore],
  ];
  ctx.font = '18px sans-serif';
  rows.forEach((row, i) => {
    const y = 300 + i * 36;
    const isTotal = i === rows.length - 1;
    ctx.fillStyle = isTotal ? PALETTE.titleGold : '#c9d2e4';
    ctx.font = (isTotal ? 'bold ' : '') + '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row[0], GAME_WIDTH / 2 - 170, y);
    ctx.textAlign = 'right';
    ctx.fillText(row[1], GAME_WIDTH / 2 + 170, y);
  });
  const blink = 0.55 + 0.45 * Math.sin(Date.now() / 300);
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press R to run it again', GAME_WIDTH / 2, 500);
  ctx.restore();
}

/* One full frame for the current state. */
function renderGame(ctx, game) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawFloor(ctx, game.level);
  if (game.state !== 'title') {
    drawVisionCones(ctx, game.guards, game.cameras);
  }
  drawWalls(ctx, game.level);
  drawPedestals(ctx, game.level);
  drawLootAndVault(ctx, game.level, game.elapsedSeconds);
  drawExitAndEntrance(ctx, game.level, game.elapsedSeconds);
  if (game.state !== 'title') {
    drawSmokeAndCoins(ctx, game.smokes, game.coins);
    drawThief(ctx, game.thief);
    for (const guard of game.guards) drawGuard(ctx, guard);
    for (const camera of game.cameras) drawCamera(ctx, camera);
  }
  if (game.state === 'play') {
    drawHud(ctx, game);
    drawHintBar(ctx);
    drawSpottedBanner(ctx, game);
  } else if (game.state === 'title') {
    drawTitleScreen(ctx);
  } else {
    drawHud(ctx, game);
    drawEndScreen(ctx, game);
  }
}
