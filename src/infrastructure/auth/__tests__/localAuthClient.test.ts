import * as SecureStore from 'expo-secure-store';
import {
  createLocalAuthClient,
  LOCAL_SESSION_KEY,
  type LocalSessionStorage,
} from '../localAuthClient';
import { sessionStorage } from '../sessionStorage';

const baseUrl = 'http://127.0.0.1:8000/api/v1';
const initialTime = 1_800_000_000_000;
const accessToken = 't'.repeat(43); // Synthetic test token only.
const credentials = {
  email: 'person@example.com',
  password: 'Synthetic-only-password-123',
};
const issuedSession = () => ({
  access_token: accessToken,
  token_type: 'bearer',
  expires_at: initialTime / 1_000 + 1_200,
  expires_in: 1_200,
  user: {
    id: 'd242737c-ef74-49ea-8549-0479a32fbb90',
    email: credentials.email,
    user_metadata: { full_name: 'Persona de prueba' },
    app_metadata: { role: 'usuario', auth_provider: 'local' },
  },
});
const remoteSession = () => {
  const { access_token: _unused, ...session } = issuedSession();
  return session;
};
const response = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
let values: Map<string, string>;
let storage: LocalSessionStorage;
let clock: number;
let transport: jest.MockedFunction<typeof fetch>;
const makeClient = (
  overrides: Partial<Parameters<typeof createLocalAuthClient>[0]> = {},
) =>
  createLocalAuthClient({
    baseUrl,
    isDevelopment: true,
    storage,
    fetch: transport,
    now: () => clock,
    ...overrides,
  });

beforeEach(() => {
  values = new Map();
  clock = initialTime;
  storage = {
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key) => {
      values.delete(key);
    }),
  };
  transport = jest.fn(async (url) => {
    if (String(url).endsWith('/session')) return response(remoteSession());
    if (String(url).endsWith('/logout')) return response(null, 204);
    return response(issuedSession());
  });
});
afterEach(() => jest.restoreAllMocks());

it('persists only the API-bound credential in SecureStore and validates it remotely after restart', async () => {
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
  const first = makeClient({ storage: sessionStorage });
  expect((await first.auth.signInWithPassword(credentials)).error).toBeNull();
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
    LOCAL_SESSION_KEY,
    expect.any(String),
    {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
  const persisted = JSON.parse(values.get(LOCAL_SESSION_KEY)!);
  expect(persisted).toMatchObject({ provider: 'local', baseUrl });
  expect(persisted.user).toBeUndefined();
  expect(persisted.password).toBeUndefined();
  const restarted = makeClient({ storage: sessionStorage });
  const restored = await restarted.auth.getSession();
  expect(restored.error).toBeNull();
  expect(restored.data.session?.user).toEqual(issuedSession().user);
  expect(restored.data.session?.access_token === accessToken).toBe(true);
  expect(transport).toHaveBeenLastCalledWith(
    `${baseUrl}/local-auth/session`,
    expect.objectContaining({
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      headers: expect.objectContaining({ Authorization: expect.any(String) }),
    }),
  );
  expect((await restarted.auth.signOut({ scope: 'local' })).error).toBeNull();
  expect(values.has(LOCAL_SESSION_KEY)).toBe(false);
  expect((await makeClient().auth.getSession()).data.session).toBeNull();
});

it('uses memory only on web and never touches browser persistence', async () => {
  const { sessionStorage: webStorage } = jest.requireActual<{
    sessionStorage: undefined;
  }>('../sessionStorage.web');
  const previousLocal = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  const previousSession = Object.getOwnPropertyDescriptor(
    globalThis,
    'sessionStorage',
  );
  const browser = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: browser,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: browser,
  });
  try {
    expect(webStorage).toBeUndefined();
    const client = makeClient({ storage: webStorage });
    expect(
      (await client.auth.signInWithPassword(credentials)).error,
    ).toBeNull();
    expect((await client.auth.getSession()).data.session).not.toBeNull();
    expect(
      (await makeClient({ storage: webStorage }).auth.getSession()).data
        .session,
    ).toBeNull();
    for (const method of Object.values(browser))
      expect(method).not.toHaveBeenCalled();
    expect(values.size).toBe(0);
  } finally {
    if (previousLocal)
      Object.defineProperty(globalThis, 'localStorage', previousLocal);
    else Reflect.deleteProperty(globalThis, 'localStorage');
    if (previousSession)
      Object.defineProperty(globalThis, 'sessionStorage', previousSession);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

it.each([
  'http://127.0.0.1:8001/api/v1',
  'http://localhost:8000/api/v1',
  `${baseUrl}/`,
])(
  'never sends a persisted token to a different exact API base: %s',
  async (otherBase) => {
    await makeClient().auth.signInWithPassword(credentials);
    transport.mockClear();
    const result = await makeClient({ baseUrl: otherBase }).auth.getSession();
    expect(result.data.session).toBeNull();
    expect(transport).not.toHaveBeenCalled();
    expect(values.has(LOCAL_SESSION_KEY)).toBe(false);
  },
);

it('ignores Supabase storage and rejects a foreign provider in the local record', async () => {
  values.set('sb-example-auth-token', 'unrelated-provider-data');
  await makeClient().auth.signInWithPassword(credentials);
  values.set(
    LOCAL_SESSION_KEY,
    JSON.stringify({
      ...JSON.parse(values.get(LOCAL_SESSION_KEY)!),
      provider: 'supabase',
    }),
  );
  transport.mockClear();
  expect((await makeClient().auth.getSession()).data.session).toBeNull();
  expect(transport).not.toHaveBeenCalled();
  expect(values.has('sb-example-auth-token')).toBe(true);
});

it('registers and authenticates without selectable roles or email-confirmation fiction', async () => {
  const client = makeClient();
  const listener = jest.fn();
  const subscription =
    client.auth.onAuthStateChange(listener).data.subscription;
  const result = await client.auth.signUp({
    email: ' Person@Example.com ',
    password: credentials.password,
    options: { data: { full_name: ' Persona de prueba ' } },
  });
  expect(result.error).toBeNull();
  expect(result.data.session?.user.id).toBe(issuedSession().user.id);
  const [url, init] = transport.mock.calls[0];
  expect(url).toBe(`${baseUrl}/local-auth/register`);
  expect(JSON.parse(init!.body as string)).toEqual({
    email: credentials.email,
    password: credentials.password,
    full_name: 'Persona de prueba',
  });
  expect(listener).toHaveBeenLastCalledWith('SIGNED_IN', expect.any(Object));
  subscription.unsubscribe();
  listener.mockClear();
  await client.auth.signOut({ scope: 'local' });
  expect(listener).not.toHaveBeenCalled();
});

it.each([14, 257])(
  'rejects registration password length %i before requesting the API',
  async (length) => {
    const result = await makeClient().auth.signUp({
      email: credentials.email,
      password: 'p'.repeat(length),
      options: { data: { full_name: 'Persona de prueba' } },
    });
    expect(result.data.session).toBeNull();
    expect(result.error).toBeTruthy();
    expect(transport).not.toHaveBeenCalled();
  },
);

it('keeps login compatible with old short passwords and normalizes email', async () => {
  const result = await makeClient().auth.signInWithPassword({
    email: ' PERSON@example.com ',
    password: 'old',
  });
  expect(result.error).toBeNull();
  expect(JSON.parse(transport.mock.calls[0][1]!.body as string).email).toBe(
    credentials.email,
  );
});

it.each([
  { access_token: 'header.payload.signature' },
  { expires_at: initialTime / 1_000 },
  { expires_at: initialTime / 1_000 + 1_201 },
  { expires_in: 1_201 },
  { token_type: 'jwt' },
  { user: { ...issuedSession().user, id: 'invalid' } },
  {
    user: {
      ...issuedSession().user,
      app_metadata: { role: 'administrador', auth_provider: 'local' },
    },
  },
])(
  'rejects invalid login response variant %# without persisting a session',
  async (invalid) => {
    transport.mockResolvedValueOnce(
      response({ ...issuedSession(), ...invalid }),
    );
    const result = await makeClient().auth.signInWithPassword(credentials);
    expect(result.error).toMatchObject({ code: 'invalid_response' });
    expect(values.size).toBe(0);
  },
);

it('rejects session extension and clears the persisted token', async () => {
  const client = makeClient();
  await client.auth.signInWithPassword(credentials);
  clock += 60_000;
  transport.mockResolvedValueOnce(
    response({
      ...remoteSession(),
      expires_at: issuedSession().expires_at + 30,
    }),
  );
  const result = await client.auth.getSession();
  expect(result.error).toMatchObject({ code: 'invalid_response' });
  expect(result.data.session).toBeNull();
  expect(values.size).toBe(0);
});

it('expires at the original deadline and never refreshes or contacts the API after expiry', async () => {
  const client = makeClient();
  await client.auth.signInWithPassword(credentials);
  clock += 600_000;
  await client.auth.startAutoRefresh();
  await client.auth.stopAutoRefresh();
  const persisted = JSON.parse(values.get(LOCAL_SESSION_KEY)!);
  expect(persisted.expires_at).toBe(issuedSession().expires_at);
  clock += 600_000;
  transport.mockClear();
  expect((await client.auth.getSession()).data.session).toBeNull();
  expect(transport).not.toHaveBeenCalled();
  expect(values.size).toBe(0);
});

it.each([401, 429, 500])(
  'requires remote validation after restart and clears failed status %i',
  async (status) => {
    await makeClient().auth.signInWithPassword(credentials);
    transport.mockResolvedValueOnce(
      response({ detail: 'untrusted response body' }, status),
    );
    const result = await makeClient().auth.getSession();
    expect(result.error).toMatchObject({ status });
    expect(result.data.session).toBeNull();
    expect(String(result.error)).not.toContain('untrusted response body');
    expect(values.size).toBe(0);
  },
);

it('returns generic credential and rate-limit errors without reflecting response bodies', async () => {
  const client = makeClient();
  transport.mockResolvedValueOnce(response({ detail: 'private details' }, 401));
  expect(
    (await client.auth.signInWithPassword(credentials)).error,
  ).toMatchObject({ code: 'invalid_credentials', status: 401 });
  transport.mockResolvedValueOnce(response({ detail: 'private details' }, 429));
  const limited = await client.auth.signInWithPassword(credentials);
  expect(limited.error).toMatchObject({ status: 429 });
  expect(String(limited.error)).not.toContain('private details');
});

it('clears local credentials even if remote logout cannot be confirmed', async () => {
  const client = makeClient();
  await client.auth.signInWithPassword(credentials);
  transport.mockRejectedValueOnce(new Error('private network details'));
  const result = await client.auth.signOut({ scope: 'local' });
  expect(result.error).toMatchObject({ code: 'connection_failed' });
  expect(String(result.error)).not.toContain('private network details');
  expect((await client.auth.getSession()).data.session).toBeNull();
  expect(values.size).toBe(0);
});

it('fails closed and attempts revocation when secure persistence fails', async () => {
  jest
    .mocked(storage.setItem)
    .mockRejectedValueOnce(new Error('keychain private details'));
  const client = makeClient();
  const result = await client.auth.signInWithPassword(credentials);
  expect(result.error).toMatchObject({ code: 'storage_unavailable' });
  expect(String(result.error)).not.toContain('keychain private details');
  expect(transport).toHaveBeenLastCalledWith(
    `${baseUrl}/local-auth/logout`,
    expect.any(Object),
  );
  expect((await client.auth.getSession()).data.session).toBeNull();
});

it('serializes an overlapping login and logout so a response cannot resurrect a session', async () => {
  const client = makeClient();
  const login = client.auth.signInWithPassword(credentials);
  const logout = client.auth.signOut({ scope: 'local' });
  await Promise.all([login, logout]);
  expect((await client.auth.getSession()).data.session).toBeNull();
  expect(values.size).toBe(0);
});

it.each([
  { isDevelopment: false },
  { baseUrl: '' },
  { baseUrl: 'file:///api/v1' },
  { baseUrl: 'https://example.com/api/v1?secret=value' },
  { baseUrl: 'https://example.com/api/v1#part' },
  { baseUrl: 'https://example.com' },
])(
  'rejects unsafe or incomplete local configuration variant %#',
  (overrides) => {
    expect(() => makeClient(overrides)).toThrow();
    expect(transport).not.toHaveBeenCalled();
  },
);
