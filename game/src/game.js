'use strict';

/* Midnight Vault — game state, the main loop and the rules.
   Owns the thief, the alarm meter, the clock, the tools and the
   win/lose conditions; guards, cameras and rendering live in their
   own files. A `?scene=` URL parameter stages a fixed moment of the
   game (title, cover, spotted, win) so screenshots are real renders
   of this code in a chosen state. */

const Game = {
  canvas: null,
  ctx: null,
  state: 'title', /* title | play | win | lose */
  level: null,
  blockers: [],
  thief: { x: 0, y: 0, angle: 0, r: TUNING.thiefRadius },
  guards: [],
  cameras: [],
  smokes: [],
  coins: [],
  alarm: 0,
  timeLeft: TUNING.timeLimitSeconds,
  elapsedSeconds: 0,
  lootTaken: 0,
  lootValue: 0,
  coinsLeft: TUNING.coinsStart,
  smokeLeft: TUNING.smokeStart,
  spottedFlash: 0,
  wasSeen: false,
  loseReason: null,
  timeBonus: 0,
  alarmPenalty: 0,
  finalScore: 0,
  lastTimestamp: 0,
  alarmTickTimer: 0,
  /* True while a ?scene= moment is staged for a screenshot: the
     frame stays exactly as staged instead of simulating on. */
  frozen: false,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.level = buildLevel();
    this.blockers = levelBlockers(this.level);
    this.resetRun();
    Input.init(this.canvas);
    const scene = new URLSearchParams(window.location.search).get('scene');
    if (scene) this.applyScene(scene);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Enter' && this.state === 'title') this.startGame();
      if (event.code === 'KeyR' && (this.state === 'win' || this.state === 'lose')) this.resetRun();
      if (event.code === 'KeyM') SoundBank.toggleMute();
    });
    this.canvas.addEventListener('mousedown', () => {
      SoundBank.ensure();
      if (this.state === 'title') this.startGame();
    });
    requestAnimationFrame((ts) => this.loop(ts));
  },

  resetRun() {
    this.level = buildLevel();
    this.blockers = levelBlockers(this.level);
    this.thief.x = this.level.entrance.x;
    this.thief.y = this.level.entrance.y;
    this.thief.angle = -Math.PI / 2;
    this.guards = this.level.guards.map(createGuard);
    this.cameras = this.level.cameras.map(createCamera);
    this.smokes = [];
    this.coins = [];
    this.alarm = 0;
    this.timeLeft = TUNING.timeLimitSeconds;
    this.elapsedSeconds = 0;
    this.lootTaken = 0;
    this.lootValue = 0;
    this.coinsLeft = TUNING.coinsStart;
    this.smokeLeft = TUNING.smokeStart;
    this.spottedFlash = 0;
    this.wasSeen = false;
    this.loseReason = null;
    this.timeBonus = 0;
    this.alarmPenalty = 0;
    this.finalScore = 0;
    this.frozen = false;
    this.state = 'title';
  },

  startGame() {
    SoundBank.ensure();
    SoundBank.click();
    this.resetRun();
    this.state = 'play';
  },

  finishRun(won, reason) {
    this.state = won ? 'win' : 'lose';
    this.loseReason = won ? null : reason;
    this.timeBonus = won ? Math.max(0, Math.floor(this.timeLeft)) * TUNING.timeBonusPerSecond : 0;
    this.alarmPenalty = Math.round(this.alarm) * TUNING.alarmPenaltyPerPoint;
    this.finalScore = Math.max(0, this.lootValue + this.timeBonus - this.alarmPenalty);
    if (won) SoundBank.winFanfare();
    else SoundBank.loseDrone();
  },

  throwCoin(x, y) {
    if (this.coinsLeft <= 0) return;
    this.coinsLeft -= 1;
    this.coins.push({ x, y, age: 0, life: 1.2 });
    SoundBank.coinToss();
    lureGuardsToCoin(this.guards, x, y);
  },

  dropSmoke() {
    if (this.smokeLeft <= 0) return;
    this.smokeLeft -= 1;
    this.smokes.push({ x: this.thief.x, y: this.thief.y, radius: TUNING.smokeRadius, life: TUNING.smokeDuration });
    SoundBank.smokePuff();
  },

  moveThief(dt) {
    const move = Input.moveVector();
    if (move.x === 0 && move.y === 0) return;
    this.thief.angle = Math.atan2(move.y, move.x);
    this.thief.x += move.x * TUNING.thiefSpeed * dt;
    this.thief.y += move.y * TUNING.thiefSpeed * dt;
    this.thief.x = clamp(this.thief.x, PLAY_BOUNDS.left + this.thief.r, PLAY_BOUNDS.right - this.thief.r);
    this.thief.y = clamp(this.thief.y, PLAY_BOUNDS.top + this.thief.r, PLAY_BOUNDS.bottom - this.thief.r);
    for (const blocker of this.blockers) {
      pushCircleOutOfRect(this.thief, blocker);
    }
  },

  collectLoot() {
    for (const gem of this.level.loot) {
      if (gem.taken) continue;
      if (distanceBetween(this.thief.x, this.thief.y, gem.x, gem.y) <= TUNING.lootPickupDistance) {
        gem.taken = true;
        this.lootTaken += 1;
        this.lootValue += gem.value;
        SoundBank.pickupGem();
      }
    }
    const vault = this.level.vault;
    if (!vault.taken &&
        distanceBetween(this.thief.x, this.thief.y, vault.x + vault.w / 2, vault.y + vault.h / 2) <= TUNING.vaultPickupDistance) {
      vault.taken = true;
      this.lootTaken += 1;
      this.lootValue += vault.value;
      SoundBank.pickupSapphire();
    }
  },

  updateAlarm(dt, seenByGuard, seenByCamera) {
    if (seenByGuard) this.alarm += TUNING.alarmGuardRate * dt;
    if (seenByCamera) this.alarm += TUNING.alarmCameraRate * dt;
    if (!seenByGuard && !seenByCamera) {
      this.alarm -= TUNING.alarmDecayRate * dt;
    }
    this.alarm = clamp(this.alarm, 0, TUNING.alarmCaughtAt);
    const seen = seenByGuard || seenByCamera;
    if (seen && !this.wasSeen) {
      this.spottedFlash = 1.4;
      SoundBank.spottedSting();
    }
    this.wasSeen = seen;
    if (this.spottedFlash > 0) this.spottedFlash -= dt;
    if (this.alarm >= 60) {
      this.alarmTickTimer -= dt;
      if (this.alarmTickTimer <= 0) {
        this.alarmTickTimer = 0.9;
        SoundBank.alarmTick();
      }
    }
  },

  update(dt) {
    if (this.state !== 'play') return;
    if (this.frozen) return; /* staged screenshot moment: hold still */
    this.elapsedSeconds += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finishRun(false, 'time');
      return;
    }

    for (const click of Input.takeClicks()) {
      if (click.button === 0) this.throwCoin(click.x, click.y);
    }
    if (Input.pressedOnce('KeyQ')) this.dropSmoke();

    this.moveThief(dt);
    this.collectLoot();

    let seenByGuard = false;
    let seenByCamera = false;
    for (const guard of this.guards) {
      if (updateGuard(guard, dt, this.thief, this.blockers, this.smokes)) seenByGuard = true;
      if (distanceBetween(guard.x, guard.y, this.thief.x, this.thief.y) <= TUNING.catchDistance) {
        this.finishRun(false, 'caught');
        return;
      }
    }
    for (const camera of this.cameras) {
      updateCamera(camera, dt, this.elapsedSeconds);
      if (watcherSeesThief(camera, this.thief.x, this.thief.y, this.blockers, this.smokes)) {
        seenByCamera = true;
      }
    }
    this.updateAlarm(dt, seenByGuard, seenByCamera);
    if (this.alarm >= TUNING.alarmCaughtAt) {
      this.finishRun(false, 'alarm');
      return;
    }

    for (const smoke of this.smokes) smoke.life -= dt;
    this.smokes = this.smokes.filter((smoke) => smoke.life > 0);
    for (const coin of this.coins) coin.age += dt;
    this.coins = this.coins.filter((coin) => coin.age < coin.life);

    /* Win: sapphire in hand and out the green door. */
    if (this.level.vault.taken && pointInRect(this.thief.x, this.thief.y, this.level.exitZone)) {
      this.finishRun(true, null);
    }
  },

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000 || 0);
    this.lastTimestamp = timestamp;
    this.update(dt);
    renderGame(this.ctx, this);
    requestAnimationFrame((ts) => this.loop(ts));
  },

  /* Fixed moments for screenshots: real renders of this same code,
     with the actors and the meter placed mid-heist. */
  applyScene(scene) {
    if (scene === 'title') {
      this.resetRun();
      return;
    }
    this.resetRun();
    this.state = 'play';
    if (scene === 'cover') {
      /* Mid-heist: one gem already pocketed, the thief crossing the
         open floor with a guard's cone sweeping toward them, a
         camera mid-sweep, and the alarm a third full. Frozen so the
         staged moment holds for the screenshot. */
      this.frozen = true;
      this.thief.x = 640;
      this.thief.y = 430;
      this.thief.angle = Math.PI / 4;
      this.level.loot[0].taken = true;
      this.lootTaken = 1;
      this.lootValue = TUNING.gemValue;
      this.alarm = 40;
      this.timeLeft = 132;
      this.elapsedSeconds = 48;
      this.guards[0].x = 700;
      this.guards[0].y = 300;
      this.guards[0].angle = Math.atan2(430 - 300, 640 - 700);
      this.guards[0].state = 'investigate';
      this.guards[0].investigateX = 600;
      this.guards[0].investigateY = 400;
      this.guards[0].investigateTimer = 10;
      this.guards[1].x = 960;
      this.guards[1].y = 520;
      this.guards[1].angle = -Math.PI / 2;
      this.cameras[0].angle = Math.PI / 2 + 0.5;
      this.cameras[1].angle = -0.3;
    } else if (scene === 'spotted') {
      /* The caught moment: the thief inside a guard's cone, alarm
         nearly full, SPOTTED banner up, guard in chase. Frozen so
         the alarm cannot run away to 100% before the screenshot. */
      this.frozen = true;
      this.thief.x = 700;
      this.thief.y = 330;
      this.thief.angle = Math.PI;
      this.alarm = 82;
      this.timeLeft = 96;
      this.elapsedSeconds = 84;
      this.spottedFlash = 1.4;
      this.wasSeen = true;
      this.guards[0].x = 700;
      this.guards[0].y = 200;
      this.guards[0].angle = Math.PI / 2;
      this.guards[0].state = 'chase';
      this.guards[1].x = 960;
      this.guards[1].y = 480;
      this.guards[1].angle = Math.PI;
      this.cameras[0].angle = Math.PI / 2 - 0.4;
    } else if (scene === 'win') {
      /* The getaway paid off: every gem and the sapphire taken. */
      for (const gem of this.level.loot) gem.taken = true;
      this.level.vault.taken = true;
      this.lootTaken = 4;
      this.lootValue = 3 * TUNING.gemValue + TUNING.sapphireValue;
      this.alarm = 22;
      this.timeLeft = 74;
      this.thief.x = this.level.exitZone.x + 50;
      this.thief.y = this.level.exitZone.y + 26;
      this.finishRun(true, null);
    }
  },
};

/* Test hook for the local play-test: state the automation can read. */
window.__midnightVault = Game;

document.addEventListener('DOMContentLoaded', () => {
  Game.init('game-canvas');
});
