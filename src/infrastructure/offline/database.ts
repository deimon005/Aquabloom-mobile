import { openDatabaseAsync } from 'expo-sqlite';
import type { CacheDatabase } from './cache';
export async function openCacheDatabase(): Promise<CacheDatabase | null> {
  return openDatabaseAsync('aquabloom-catalog-v1.db');
}
