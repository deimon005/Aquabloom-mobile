import type { CacheDatabase } from './cache';
// The mobile app persists with Expo SQLite. Web remains online-only until a
// deployment supplies SQLite WASM and cross-origin isolation headers.
export async function openCacheDatabase(): Promise<CacheDatabase | null> {
  return null;
}
