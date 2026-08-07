import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureName = process.argv[2] ?? 'karolina-full';
const fixturePath = resolve(root, `src/fixtures/${fixtureName}.hostess.json`);
const hostessPath = resolve(root, 'src/content/hostess.json');
const karolinaAssets = resolve(root, '../karolina/src/assets');
const templateImages = resolve(root, 'src/assets/images');
const templateVideos = resolve(root, 'src/assets/videos');

const IMAGE_MAP = {
  'images/hero.jpeg': 'hero.jpg',
  'images/event-ukraine.png': 'event-1.jpg',
  'images/event-kinder.jpeg': 'event-2.jpg',
  'images/event-apteo.jpeg': 'event-3.jpg',
  'images/event-onelife.png': 'event-4.jpg',
  'images/event-sopot.jpeg': 'event-5.jpg',
};

const VIDEO_MAP = {
  'videos/onelife.mp4': 'onelife.mp4',
};

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function copyAsset(relativePath, targetDir, targetName) {
  const source = resolve(karolinaAssets, relativePath);
  if (!existsSync(source)) {
    console.warn(`[apply-dev-fixture] Missing source asset: ${source}`);
    return false;
  }
  ensureDir(targetDir);
  const target = resolve(targetDir, targetName);
  copyFileSync(source, target);
  console.log(`[apply-dev-fixture] Copied ${relativePath} → ${targetName}`);
  return true;
}

if (!existsSync(fixturePath)) {
  console.error(`[apply-dev-fixture] Fixture not found: ${fixturePath}`);
  process.exit(1);
}

const fixture = readFileSync(fixturePath, 'utf8');
writeFileSync(hostessPath, `${fixture.trim()}\n`);
console.log(`[apply-dev-fixture] Wrote ${hostessPath}`);

for (const [source, target] of Object.entries(IMAGE_MAP)) {
  copyAsset(source, templateImages, target);
}

const sixthEventSource = resolve(karolinaAssets, 'images/event-kinder.jpeg');
if (existsSync(sixthEventSource)) {
  copyFileSync(sixthEventSource, resolve(templateImages, 'event-6.jpg'));
  console.log('[apply-dev-fixture] Copied images/event-kinder.jpeg → event-6.jpg (invented 6th event)');
}

for (const [source, target] of Object.entries(VIDEO_MAP)) {
  copyAsset(source, templateVideos, target);
}

console.log('');
console.log('[apply-dev-fixture] Done. Start review dev with:');
console.log('  pnpm dev:local');
console.log('Set REVIEW_MODE_ENABLED=true in .env to see the profile details panel and feedback toolbar.');
