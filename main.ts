/**
 * Midnight Vault — entry program for the best-heist-game bounty.
 *
 * Copies game/ and screenshots/ from this repository into the output
 * directory and writes /output/dossier.json with buildDossier from
 * vendor/makefun-game.ts. Node standard library only; no install,
 * no network. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
 * /output. The program is deterministic: two runs write the same bytes.
 */

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(join(fileURLToPath(import.meta.url), '..'));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

const gameSource = join(repoRoot, 'game');
const shotsSource = join(repoRoot, 'screenshots');

if (!existsSync(gameSource)) {
  throw new Error(`main.ts: no game/ directory next to ${repoRoot}`);
}
if (!existsSync(shotsSource)) {
  throw new Error(`main.ts: no screenshots/ directory next to ${repoRoot}`);
}

mkdirSync(outputDir, { recursive: true });

/* Clear only the paths this program owns, so a stale file from an
   earlier run can never leak into a later one. */
for (const name of ['game', 'screenshots', 'dossier.json']) {
  rmSync(join(outputDir, name), { recursive: true, force: true });
}

cpSync(gameSource, join(outputDir, 'game'), { recursive: true });
cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);

/* Self-check, mirroring the gate's dossier_matches row: rebuilding
   the dossier from what was just written must give the same bytes.
   A mismatch means the copy above and the dossier disagree, and the
   entry would fail the gate, so refuse to finish quietly. */
const rebuilt = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
if (!Buffer.from(dossier).equals(Buffer.from(rebuilt))) {
  throw new Error('main.ts: rebuilt dossier differs from the one written');
}
