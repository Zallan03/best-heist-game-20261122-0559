# Midnight Vault — Make the best heist game

![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)
![rank](https://make.fun/badge/best-heist-game-20261122-0559/Zallan03/best-heist-game-20261122-0559/rank.svg)
![reward](https://make.fun/badge/best-heist-game-20261122-0559/Zallan03/best-heist-game-20261122-0559/reward.svg)

[View the bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559)

**Midnight Vault** is an original top-down 2D heist game that runs
entirely from static files in a desktop browser — no network, no build
step. One night, one gallery, one sapphire.

## The heist

You slip into the Meridian Gallery through the service door. The
**Star Sapphire** glows in its glass case across the room, with three
gems on the display pedestals. Two guards patrol with sweeping vision
cones, and two wall cameras sweep the floor in red. Everything you
need to read — the room, the cones, the cameras, the loot and the
alarm meter — is visible in a single frame.

- **Seen by a guard or a camera, the ALARM climbs.** At 100% the
  night is over. Break line of sight and it slowly falls again.
- **Tools at a cost:** click to throw a coin (5) and lure a guard to
  the noise; press Q to drop a smoke pellet (3) and vanish from sight.
- **Several routes per room:** pedestals and partitions block sight
  as well as movement, so every lane through the gallery is a choice.
- **The getaway pays off the planning:** grab the sapphire, then slip
  out through the green EXIT door before the 3-minute clock runs out.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any
static server). Move with WASD or arrow keys, click to throw a coin,
Q for smoke, M to mute. All art is drawn in code and all sound is
synthesised with WebAudio — no assets are downloaded.

## Layout

- `game/index.html` — the page and canvas
- `game/src/config.js` — tuning, palette and geometry helpers
- `game/src/level.js` — the Meridian Gallery floor plan
- `game/src/audio.js` — synthesised sound effects
- `game/src/input.js` — keyboard and mouse input
- `game/src/vision.js` — sight rules shared by guards and cameras
- `game/src/guards.js` — guard patrol, suspicion and pursuit
- `game/src/cameras.js` — security camera sweeps
- `game/src/render.js` — every pixel: room, cones, actors, HUD
- `game/src/game.js` — state, the main loop and the rules
- `main.ts` — hands the entry in: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's dossier library, unchanged
  from the kit

## License

MIT — see [LICENSE](LICENSE).
