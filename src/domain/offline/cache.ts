export type CachedValue<T> = {
  data: T;
  source: 'network' | 'cache';
  savedAt: number;
};
export class OfflineCacheMissError extends Error {
  constructor() {
    super(
      'No hay datos guardados vigentes para esta consulta. Conéctate a internet e inténtalo nuevamente.',
    );
    this.name = 'OfflineCacheMissError';
  }
}
export function aborted() {
  return Object.assign(new Error('Consulta cancelada.'), {
    name: 'AbortError',
  });
}

export type CatalogCache = {
  now: () => number;
  version: () => number;
  clear: () => Promise<void>;
  remove: (scope: string, key: string) => Promise<void>;
  read: (
    scope: string,
    key: string,
  ) => Promise<{ data: unknown; savedAt: number } | null>;
  write: (
    scope: string,
    key: string,
    payload: unknown,
    version: number,
    signal?: AbortSignal,
  ) => Promise<void>;
};
export type CachedCatalogReader = <T>(
  key: readonly unknown[],
  load: () => Promise<unknown>,
  parse: (value: unknown) => T,
  signal?: AbortSignal,
) => Promise<CachedValue<T>>;
