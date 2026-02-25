#!/usr/bin/env node
/**
 * generate-sprites.mjs
 *
 * Generates AI bird sprites for the Hatch app using FREE image generation APIs.
 *
 * Providers (no paid API required):
 *   • pollinations  [default] — Pollinations.AI via FLUX, no API key needed
 *   • huggingface             — HF Router API (FLUX.1-schnell), requires HF_TOKEN in .env
 *   • gemini                  — Google Gemini 2.5 Flash Image, 500 img/day free, requires GEMINI_API_KEY
 *                               Get free key at: https://aistudio.google.com/apikey
 *
 * Usage:
 *   node scripts/generate-sprites.mjs                          # all 36 sprites, Pollinations
 *   node scripts/generate-sprites.mjs --provider huggingface   # use Hugging Face
 *   node scripts/generate-sprites.mjs --provider gemini        # use Google Gemini (recommended)
 *   node scripts/generate-sprites.mjs --bird bem-te-vi         # single bird, all stages
 *   node scripts/generate-sprites.mjs --bird tucano --stage adulto  # single sprite
 *   node scripts/generate-sprites.mjs --help
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Load .env if present ────────────────────────────────────────────────────
const envPath = join(ROOT, '.env');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
Usage: node scripts/generate-sprites.mjs [options]

Options:
  --provider <name>   Image provider:
                        "pollinations"  (default) free, no key, uses FLUX
                        "gemini"        free key from aistudio.google.com, 500 img/day (recommended)
                        "huggingface"   free key from huggingface.co, FLUX.1-schnell
  --bird <id>         Only generate sprites for this bird id (e.g. bem-te-vi)
  --stage <stage>     Only generate this stage: filhote | jovem | adulto
  --skip-existing     Skip sprites that already exist as .png files
  --help              Show this help

Examples:
  node scripts/generate-sprites.mjs
  node scripts/generate-sprites.mjs --provider gemini
  node scripts/generate-sprites.mjs --bird harpia --stage adulto --provider gemini
  node scripts/generate-sprites.mjs --provider huggingface
`);
  process.exit(0);
}

const PROVIDER   = args[args.indexOf('--provider') + 1] ?? 'pollinations';
const FILTER_BIRD  = args.includes('--bird')  ? args[args.indexOf('--bird')  + 1] : null;
const FILTER_STAGE = args.includes('--stage') ? args[args.indexOf('--stage') + 1] : null;
const SKIP_EXISTING = args.includes('--skip-existing');

// ─── Config ──────────────────────────────────────────────────────────────────
const STAGES = ['filhote', 'jovem', 'adulto'];
const IMAGE_SIZE = 512;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
// Pollinations anonymous rate limit: 1 req / 15s. Add small buffer.
const POLLINATIONS_DELAY_MS = 16000;

const PROMPTS_FILE = join(__dirname, 'bird-prompts.json');
const { artStyle, stageModifiers, birds } = JSON.parse(readFileSync(PROMPTS_FILE, 'utf-8'));

// ─── Prompt builder ──────────────────────────────────────────────────────────
function buildPrompt(bird, stage) {
  return [
    artStyle,
    bird.visualDescription,
    stageModifiers[stage],
    `Species: ${bird.species}`,
  ].join('. ');
}

// ─── Download helper ─────────────────────────────────────────────────────────
function downloadUrl(url, destPath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 120_000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadUrl(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const stream = createWriteStream(destPath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

// ─── POST helper (returns binary buffer) ────────────────────────────────────
function postJson(options, bodyObj) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(bodyObj);
    const opts = { ...options, method: 'POST', headers: { ...options.headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${buf.toString().slice(0, 200)}`));
        }
        resolve(buf);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Providers ───────────────────────────────────────────────────────────────
async function generatePollinations(prompt, destPath, seed) {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${IMAGE_SIZE}&height=${IMAGE_SIZE}&model=flux&nologo=true&seed=${seed}`;
  await downloadUrl(url, destPath);
}

async function generateGemini(prompt, destPath) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env — get a free key at https://aistudio.google.com/apikey');

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const buf = await new Promise((resolve, reject) => {
    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode !== 200) {
          return reject(new Error(`Gemini HTTP ${res.statusCode}: ${raw.slice(0, 300)}`));
        }
        try {
          const json = JSON.parse(raw);
          const parts = json.candidates?.[0]?.content?.parts ?? [];
          const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
          if (!imgPart) return reject(new Error('Gemini response contained no image part'));
          resolve(Buffer.from(imgPart.inlineData.data, 'base64'));
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  writeFileSync(destPath, buf);
}

async function generateHuggingFace(prompt, destPath) {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error('HF_TOKEN not set in .env — required for --provider huggingface');
  const buf = await postJson(
    {
      hostname: 'router.huggingface.co',
      path: '/models/black-forest-labs/FLUX.1-schnell',
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120_000,
    },
    { inputs: prompt, parameters: { width: IMAGE_SIZE, height: IMAGE_SIZE } }
  );
  writeFileSync(destPath, buf);
}

async function generate(provider, prompt, destPath, seed) {
  if (provider === 'gemini')      return generateGemini(prompt, destPath);
  if (provider === 'huggingface') return generateHuggingFace(prompt, destPath);
  return generatePollinations(prompt, destPath, seed);
}

// ─── Retry wrapper ───────────────────────────────────────────────────────────
async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`  ⚠ Attempt ${attempt} failed for ${label}: ${err.message} — retrying in ${RETRY_DELAY_MS / 1000}s`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

// ─── Patch bird.model.ts: .svg → .png ────────────────────────────────────────
function patchBirdModel() {
  const modelPath = join(ROOT, 'src', 'app', 'core', 'models', 'bird.model.ts');
  const content = readFileSync(modelPath, 'utf-8');
  if (!content.includes('.svg')) {
    console.log('ℹ bird.model.ts already uses .png paths — no patch needed.');
    return;
  }
  const patched = content.replaceAll('.svg', '.png');
  writeFileSync(modelPath, patched, 'utf-8');
  console.log('✏  Patched bird.model.ts: .svg → .png');
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🐦 Hatch Sprite Generator`);
  console.log(`   Provider : ${PROVIDER}`);
  console.log(`   Size     : ${IMAGE_SIZE}×${IMAGE_SIZE}px`);
  if (FILTER_BIRD)  console.log(`   Bird     : ${FILTER_BIRD}`);
  if (FILTER_STAGE) console.log(`   Stage    : ${FILTER_STAGE}`);
  console.log('');

  const todo = [];
  for (const bird of birds) {
    if (FILTER_BIRD && bird.id !== FILTER_BIRD) continue;
    for (const stage of STAGES) {
      if (FILTER_STAGE && stage !== FILTER_STAGE) continue;
      todo.push({ bird, stage });
    }
  }

  if (todo.length === 0) {
    console.error('No sprites matched the given filters.');
    process.exit(1);
  }

  console.log(`Generating ${todo.length} sprite(s)...\n`);

  let done = 0;
  let failed = 0;
  const seed = Date.now();

  for (const { bird, stage } of todo) {
    const birdDir = join(ROOT, 'src', 'assets', 'birds', bird.id);
    mkdirSync(birdDir, { recursive: true });

    const destPath = join(birdDir, `${stage}.png`);

    if (SKIP_EXISTING && existsSync(destPath)) {
      console.log(`  ⏭  Skipping ${bird.id}/${stage}.png (exists)`);
      done++;
      continue;
    }

    const prompt = buildPrompt(bird, stage);
    const label = `${bird.id}/${stage}`;

    process.stdout.write(`  ⏳ ${label} ... `);

    try {
      await withRetry(
        () => generate(PROVIDER, prompt, destPath, seed + done),
        label
      );
      done++;
      console.log(`✓ saved`);
    } catch (err) {
      failed++;
      console.log(`✗ FAILED: ${err.message}`);
    }

    // Rate-limit delays
    const isLast = (done + failed) >= todo.length;
    if (!isLast) {
      if (PROVIDER === 'pollinations') {
        process.stdout.write(`     ⏱  Waiting ${POLLINATIONS_DELAY_MS / 1000}s (rate limit)...`);
        await new Promise(r => setTimeout(r, POLLINATIONS_DELAY_MS));
        process.stdout.write(' ok\n');
      } else if (PROVIDER === 'gemini') {
        // Free tier: 15 RPM → wait 5s between requests to stay safely under limit
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  console.log(`\n─────────────────────────────`);
  console.log(`✅ Done: ${done} sprites generated`);
  if (failed > 0) console.log(`❌ Failed: ${failed} sprites`);

  // If all 36 were generated, patch the model to use .png
  if (!FILTER_BIRD && !FILTER_STAGE && failed === 0) {
    patchBirdModel();
  } else if (failed === 0) {
    console.log('\nℹ  Run without --bird/--stage filters to auto-patch bird.model.ts paths.');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
