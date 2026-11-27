import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { sessionStorage } from '../sessionStorage';
import { sessionFor } from '../../../presentation/auth/__tests__/authFixture';

const values = new Map<string, string>();
beforeEach(() => {
  values.clear();
  jest
    .spyOn(SecureStore, 'getItemAsync')
    .mockImplementation(async (key) => values.get(key) ?? null);
  jest
    .spyOn(SecureStore, 'setItemAsync')
    .mockImplementation(async (key, value) => {
      values.set(key, value);
    });
  jest.spyOn(SecureStore, 'deleteItemAsync').mockImplementation(async (key) => {
    values.delete(key);
  });
});
afterEach(() => jest.restoreAllMocks());

it('restores the Supabase session in a new client and removes it on logout', async () => {
  const transport = jest.fn(
    async () =>
      new Response(JSON.stringify(sessionFor()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  const makeClient = () =>
    createClient('https://restart.example.com', 'public-test', {
      auth: {
        storage: sessionStorage,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: transport },
    });
  const first = makeClient();
  const signedIn = await first.auth.signInWithPassword({
    email: 'jose@example.com',
    password: 'test-only',
  });
  expect(signedIn.error).toBeNull();
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(String),
    {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
  const restarted = makeClient();
  expect((await restarted.auth.getSession()).data.session?.user.id).toBe(
    'jose',
  );
  expect(transport).toHaveBeenCalledTimes(1);
  expect((await restarted.auth.signOut({ scope: 'local' })).error).toBeNull();
  expect((await makeClient().auth.getSession()).data.session).toBeNull();
});

it('propagates keychain failures instead of falling back to insecure storage', async () => {
  jest
    .mocked(SecureStore.setItemAsync)
    .mockRejectedValueOnce(new Error('keychain unavailable'));
  await expect(sessionStorage.setItem('session', 'sensitive')).rejects.toThrow(
    'keychain unavailable',
  );
  expect(values.size).toBe(0);
});
