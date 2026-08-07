import { loadHostess } from '@/lib/hostess';

let cachedInvented: Set<string> | null = null;

function inventedSet(): Set<string> {
  if (cachedInvented) return cachedInvented;
  const hostess = loadHostess() as { fixtureInvented?: string[] };
  cachedInvented = new Set(Array.isArray(hostess.fixtureInvented) ? hostess.fixtureInvented : []);
  return cachedInvented;
}

export function isFixtureInvented(key: string): boolean {
  if (!key) return false;
  const set = inventedSet();
  if (set.has(key)) return true;

  const normalized = key.replace(/\[(\d+)\]/g, '.$1');
  if (set.has(normalized)) return true;

  const bracketForm = key.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
  return set.has(bracketForm);
}

export function fixtureInventedKeys(): string[] {
  return [...inventedSet()];
}

export function studyInventedKey(index: number): string {
  return `studies.${index}`;
}

export function eventInventedKey(eventId: string): string {
  return `events.${eventId}`;
}

export function socialInventedKey(platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin'): string {
  return `profile.socials.${platform}`;
}
