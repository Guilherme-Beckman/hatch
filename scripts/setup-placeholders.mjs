#!/usr/bin/env node
/**
 * setup-placeholders.mjs
 *
 * Creates 36 placeholder SVG files (12 birds × 3 stages) inside
 * src/assets/birds/{bird-id}/{stage}.svg
 *
 * Each placeholder shows a colored circle with the bird name and stage.
 * Run this once to make the app render something real while awaiting AI sprites.
 *
 * Usage:
 *   node scripts/setup-placeholders.mjs
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = join(ROOT, 'src', 'assets', 'birds');
const PROMPTS_FILE = join(__dirname, 'bird-prompts.json');

const { birds } = JSON.parse(readFileSync(PROMPTS_FILE, 'utf-8'));

const STAGES = ['filhote', 'jovem', 'adulto'];

const STAGE_CONFIG = {
  filhote: { scale: 0.45, label: 'Hatchling', yOffset: 0 },
  jovem:   { scale: 0.65, label: 'Juvenile',  yOffset: 0 },
  adulto:  { scale: 0.85, label: 'Adult',     yOffset: 0 },
};

function buildSvg(bird, stage) {
  const { scale, label } = STAGE_CONFIG[stage];
  const color = bird.rarityColor;
  const r = Math.round(255 * scale);
  const size = 512;
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.round(size * 0.44 * scale);
  const outerRadius = Math.round(size * 0.44);

  // Darken the rarity color slightly for the ring
  const ringColor = color;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <!-- Background circle -->
  <circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="#F8F9FA" />
  <!-- Rarity ring -->
  <circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="none" stroke="${ringColor}" stroke-width="12" opacity="0.6" />

  <!-- Bird body placeholder (circle scaled by stage) -->
  <circle cx="${cx}" cy="${cy - 20}" r="${radius}" fill="${color}" opacity="0.85" />

  <!-- Simple beak -->
  <polygon
    points="${cx},${cy - 20 + radius * 0.55} ${cx - radius * 0.18},${cy - 20 + radius * 0.35} ${cx + radius * 0.18},${cy - 20 + radius * 0.35}"
    fill="#E67E22"
    opacity="0.9"
  />

  <!-- Eye -->
  <circle cx="${cx - radius * 0.22}" cy="${cy - 20 - radius * 0.1}" r="${Math.max(4, radius * 0.13)}" fill="#2C3E50" />
  <circle cx="${cx - radius * 0.22 - radius * 0.04}" cy="${cy - 20 - radius * 0.1 - radius * 0.04}" r="${Math.max(2, radius * 0.05)}" fill="white" />

  <!-- Bird name -->
  <text
    x="${cx}"
    y="${cy + outerRadius * 0.62}"
    text-anchor="middle"
    font-family="system-ui, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#2C3E50"
    opacity="0.9"
  >${bird.name}</text>

  <!-- Stage label -->
  <text
    x="${cx}"
    y="${cy + outerRadius * 0.62 + 36}"
    text-anchor="middle"
    font-family="system-ui, sans-serif"
    font-size="20"
    fill="${color}"
    font-weight="600"
    opacity="0.8"
  >${label}</text>
</svg>`;
}

let created = 0;
let skipped = 0;

for (const bird of birds) {
  const birdDir = join(ASSETS_DIR, bird.id);
  mkdirSync(birdDir, { recursive: true });

  for (const stage of STAGES) {
    const filePath = join(birdDir, `${stage}.svg`);
    const svg = buildSvg(bird, stage);
    writeFileSync(filePath, svg, 'utf-8');
    created++;
    console.log(`✓ ${bird.id}/${stage}.svg`);
  }
}

console.log(`\n✅ Done — ${created} placeholder SVGs created in src/assets/birds/`);
console.log(`\nNext step: run  npm run sprites:generate  to replace with AI sprites.`);
