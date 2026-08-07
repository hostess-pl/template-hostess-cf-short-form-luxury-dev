import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf8');
  const entries = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

const envFile = loadEnvFile();
const supabaseUrl = process.env.SUPABASE_URL || envFile.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY || '';
const siteUrl = process.env.SITE_URL || envFile.SITE_URL || 'http://localhost:4321';

const fixtureName = process.argv[2] ?? 'karolina-full';
const seedsPath = resolve(root, `src/fixtures/${fixtureName}.review-seeds.json`);

if (!supabaseUrl || !supabaseKey) {
  console.error('[seed-review-comments] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env/.env');
  process.exit(1);
}

if (!existsSync(seedsPath)) {
  console.error(`[seed-review-comments] Seeds file not found: ${seedsPath}`);
  process.exit(1);
}

function siteKeyFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return 'localhost';
  }
}

const seeds = JSON.parse(readFileSync(seedsPath, 'utf8'));
const siteKey = siteKeyFromUrl(siteUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

const rows = seeds.map((seed) => ({
  site_key: siteKey,
  page_path: seed.page_path,
  locale: seed.locale,
  selector: seed.selector,
  rel_x: seed.rel_x,
  rel_y: seed.rel_y,
  rel_w: seed.annotation_type === 'region' ? seed.rel_w ?? null : null,
  rel_h: seed.annotation_type === 'region' ? seed.rel_h ?? null : null,
  doc_x: seed.doc_x,
  doc_y: seed.doc_y,
  annotation_type: seed.annotation_type ?? 'point',
  message: seed.message,
  author_name: seed.author_name ?? 'Dev seed',
  status: 'open',
}));

const { data, error } = await supabase.from('preview_feedback_comments').insert(rows).select('id');

if (error) {
  console.error('[seed-review-comments] Insert failed:', error.message);
  process.exit(1);
}

console.log(`[seed-review-comments] Inserted ${data?.length ?? 0} comments for site_key=${siteKey}`);
console.log('[seed-review-comments] Open the dev site with review mode to see seeded pins.');
