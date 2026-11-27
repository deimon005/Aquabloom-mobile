import { QueryClient } from '@tanstack/react-query';
import { AuthError } from '@supabase/supabase-js';
import { signOutAndClearCache } from '../signOut';
import { authFixture } from '../../../presentation/auth/__tests__/authFixture';
import * as persistentCache from '../../../composition/catalogCache';

jest.mock('../../../infrastructure/auth/supabase', () => ({ supabase: null }));

afterEach(() => jest.restoreAllMocks());

it('removes persisted responses before closing the session', async () => {
  const clear = jest
    .spyOn(persistentCache, 'clearCatalogCache')
    .mockResolvedValue(undefined);
  const auth = authFixture();
  auth.signOut.mockImplementationOnce(async () => {
    expect(clear).toHaveBeenCalledTimes(1);
    return { error: null };
  });
  await signOutAndClearCache(
    auth.client,
    createQueryClient(),
    persistentCache.clearCatalogCache,
  );
  expect(auth.signOut).toHaveBeenCalledTimes(1);
});

it('does not report successful logout when persistent cleanup fails', async () => {
  jest
    .spyOn(persistentCache, 'clearCatalogCache')
    .mockRejectedValueOnce(new Error('disk unavailable'));
  const auth = authFixture();
  const cache = createQueryClient();
  cache.setQueryData(['private'], 'data');
  await expect(
    signOutAndClearCache(auth.client, cache, persistentCache.clearCatalogCache),
  ).rejects.toThrow('disk unavailable');
  expect(auth.signOut).not.toHaveBeenCalled();
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { gcTime: 0 }, mutations: { gcTime: 0 } },
  });
}

it('signs out only the current session and clears queries and mutations', async () => {
  const auth = authFixture();
  const cache = createQueryClient();
  cache.setQueryData(['private'], 'sensitive');
  cache.getMutationCache().build(cache, { mutationKey: ['private'] });
  await signOutAndClearCache(
    auth.client,
    cache,
    persistentCache.clearCatalogCache,
  );
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
  expect(cache.getMutationCache().getAll()).toHaveLength(0);
});

it('aborts pending requests and prevents late results from repopulating cache', async () => {
  const auth = authFixture();
  const cache = createQueryClient();
  let resolve!: (data: string) => void;
  let signal!: AbortSignal;
  const pending = cache
    .fetchQuery({
      queryKey: ['private'],
      queryFn: (context) => {
        signal = context.signal;
        return new Promise<string>((done) => {
          resolve = done;
        });
      },
    })
    .catch(() => undefined);
  await signOutAndClearCache(
    auth.client,
    cache,
    persistentCache.clearCatalogCache,
  );
  expect(signal.aborted).toBe(true);
  resolve('late private data');
  await pending;
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
});

it('reports a Supabase failure while still clearing cached data', async () => {
  const auth = authFixture();
  const cache = createQueryClient();
  const error = new AuthError('unavailable');
  auth.signOut.mockResolvedValueOnce({ error });
  cache.setQueryData(['private'], 'sensitive');
  await expect(
    signOutAndClearCache(auth.client, cache, persistentCache.clearCatalogCache),
  ).rejects.toBe(error);
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
});

it('clears cache after a thrown network error and supports a retry', async () => {
  const auth = authFixture();
  const cache = createQueryClient();
  auth.signOut.mockImplementationOnce(async () => {
    cache.setQueryData(['late'], 'sensitive');
    throw new Error('network');
  });
  await expect(
    signOutAndClearCache(auth.client, cache, persistentCache.clearCatalogCache),
  ).rejects.toThrow('network');
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
  await expect(
    signOutAndClearCache(auth.client, cache, persistentCache.clearCatalogCache),
  ).resolves.toBeUndefined();
});
