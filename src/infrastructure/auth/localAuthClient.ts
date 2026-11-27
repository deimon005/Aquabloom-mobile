import { z } from 'zod';
import type {
  AuthClient,
  AuthSession,
  PasswordClient,
  SessionRefresh,
} from '../../domain/auth/auth';
import {
  registrationSchema,
  type RegistrationClient,
} from '../../domain/auth/registration';

export type LocalSessionStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};
export const LOCAL_SESSION_KEY = 'aquabloom.local-auth.session.v1';
const MAX_LIFETIME_SECONDS = 1_200;
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,512}$/);
const userSchema = z.object({
  id: z.uuid(),
  email: z.email().max(254),
  user_metadata: z.object({ full_name: z.string().trim().min(2).max(120) }),
  app_metadata: z.object({
    role: z.literal('usuario'),
    auth_provider: z.literal('local'),
  }),
});
const sessionSchema = z.object({
  token_type: z.literal('bearer'),
  expires_at: z.number().int().positive(),
  expires_in: z.number().int().positive().max(MAX_LIFETIME_SECONDS),
  user: userSchema,
});
const issuedSessionSchema = sessionSchema.extend({ access_token: tokenSchema });
const storedSchema = z.object({
  version: z.literal(1),
  provider: z.literal('local'),
  baseUrl: z.string(),
  access_token: tokenSchema,
  expires_at: z.number().int().positive(),
});
type StoredSession = z.infer<typeof storedSchema>;
type LocalSession = z.infer<typeof issuedSessionSchema>;
type LocalAuthClient = AuthClient &
  PasswordClient &
  RegistrationClient & {
    auth: SessionRefresh;
  };

// Never propagate server bodies or network errors that might include credentials.
class LocalAuthError extends Error {
  constructor(
    readonly code: string,
    readonly status?: number,
  ) {
    super('No se pudo completar la operación de autenticación local.');
    this.name = 'LocalAuthError';
  }
}

export function createLocalAuthClient({
  baseUrl,
  isDevelopment,
  storage,
  fetch: request = globalThis.fetch,
  now = Date.now,
}: {
  baseUrl: string;
  isDevelopment: boolean;
  storage?: LocalSessionStorage;
  fetch?: typeof fetch;
  now?: () => number;
}): LocalAuthClient {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new LocalAuthError('invalid_configuration');
  }
  if (
    !isDevelopment ||
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.replace(/\/$/, '').endsWith('/api/v1')
  )
    throw new LocalAuthError('invalid_configuration');

  let credential: StoredSession | null = null;
  let loaded = false;
  const listeners = new Set<
    (event: string, session: AuthSession | null) => void
  >();
  // Serialize storage and network operations so a late request cannot resurrect logout.
  let pending = Promise.resolve();
  const exclusive = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = pending.then(operation);
    pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
  const emit = (event: string, session: AuthSession | null) => {
    for (const listener of listeners) {
      try {
        listener(event, session);
      } catch {
        /* A listener cannot break session cleanup. */
      }
    }
  };
  const clear = async () => {
    credential = null;
    loaded = true;
    emit('SIGNED_OUT', null);
    try {
      await storage?.removeItem(LOCAL_SESSION_KEY);
    } catch {
      throw new LocalAuthError('storage_unavailable');
    }
  };
  const validExpiry = (expiresAt: number) => {
    const seconds = Math.floor(now() / 1_000);
    return expiresAt > seconds && expiresAt <= seconds + MAX_LIFETIME_SECONDS;
  };
  const load = async () => {
    if (loaded) return;
    loaded = true;
    let raw: string | null;
    try {
      raw = (await storage?.getItem(LOCAL_SESSION_KEY)) ?? null;
    } catch {
      throw new LocalAuthError('storage_unavailable');
    }
    if (!raw) return;
    try {
      const result = storedSchema.safeParse(JSON.parse(raw));
      if (
        result.success &&
        result.data.baseUrl === baseUrl &&
        validExpiry(result.data.expires_at)
      ) {
        credential = result.data;
        return;
      }
    } catch {
      /* Malformed persisted data is discarded without exposing it. */
    }
    await clear();
  };
  const send = async (
    path: string,
    method: 'GET' | 'POST',
    body?: unknown,
    token?: string,
  ) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await request(
        `${baseUrl.replace(/\/$/, '')}/local-auth/${path}`,
        {
          method,
          headers: {
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          credentials: 'omit',
          cache: 'no-store',
          redirect: 'error',
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        throw new LocalAuthError(
          response.status === 401 ? 'invalid_credentials' : 'request_failed',
          response.status,
        );
      }
      if (response.status === 204) return null;
      return (await response.json()) as unknown;
    } catch (error) {
      if (error instanceof LocalAuthError) throw error;
      throw new LocalAuthError('connection_failed');
    } finally {
      clearTimeout(timeout);
    }
  };
  const authenticate = (path: 'login' | 'register', body: unknown) =>
    exclusive(async () => {
      try {
        // Drop any previous local identity before attempting an account change.
        await clear();
        const result = issuedSessionSchema.safeParse(
          await send(path, 'POST', body),
        );
        if (!result.success || !validExpiry(result.data.expires_at))
          throw new LocalAuthError('invalid_response');
        const session: LocalSession = result.data;
        const stored: StoredSession = {
          version: 1,
          provider: 'local',
          baseUrl,
          access_token: session.access_token,
          expires_at: session.expires_at,
        };
        try {
          await storage?.setItem(LOCAL_SESSION_KEY, JSON.stringify(stored));
        } catch {
          // A keychain failure must not leave a usable, partly persisted session.
          try {
            await send('logout', 'POST', undefined, session.access_token);
          } catch {
            /* Server expiry still applies. */
          }
          throw new LocalAuthError('storage_unavailable');
        }
        credential = stored;
        emit('SIGNED_IN', session);
        return { data: { session }, error: null };
      } catch (error) {
        try {
          await clear();
        } catch {
          error = new LocalAuthError('storage_unavailable');
        }
        return { data: { session: null }, error };
      }
    });

  const getSession: AuthClient['auth']['getSession'] = () =>
    exclusive(async () => {
      try {
        await load();
        if (!credential) return { data: { session: null }, error: null };
        if (!validExpiry(credential.expires_at)) {
          await clear();
          return { data: { session: null }, error: null };
        }
        const result = sessionSchema.safeParse(
          await send('session', 'GET', undefined, credential.access_token),
        );
        if (
          !result.success ||
          !validExpiry(result.data.expires_at) ||
          result.data.expires_at !== credential.expires_at
        )
          throw new LocalAuthError('invalid_response');
        return {
          data: {
            session: { ...result.data, access_token: credential.access_token },
          },
          error: null,
        };
      } catch (error) {
        // Remote validation is mandatory, including after restart and while offline.
        try {
          await clear();
        } catch {
          error = new LocalAuthError('storage_unavailable');
        }
        return { data: { session: null }, error };
      }
    });
  return {
    auth: {
      getSession,
      onAuthStateChange(listener) {
        listeners.add(listener);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(listener);
              },
            },
          },
        };
      },
      signInWithPassword: ({ email, password }) =>
        authenticate('login', { email: email.trim().toLowerCase(), password }),
      signUp: ({ email, password, options }) => {
        const parsed = registrationSchema.safeParse({
          email,
          password,
          confirmPassword: password,
          fullName: options.data.full_name,
        });
        if (!parsed.success)
          return Promise.resolve({
            data: { session: null },
            error: new LocalAuthError('invalid_registration'),
          });
        return authenticate('register', {
          email: parsed.data.email.toLowerCase(),
          password,
          full_name: parsed.data.fullName,
        });
      },
      signOut: () =>
        exclusive(async () => {
          let error: unknown = null;
          try {
            await load();
            if (credential)
              await send('logout', 'POST', undefined, credential.access_token);
          } catch (failure) {
            error = failure;
          }
          try {
            await clear();
          } catch (failure) {
            error = failure;
          }
          return { error };
        }),
      // Foreground validation never extends the server's fixed 20-minute expiry.
      startAutoRefresh: async () => {
        await getSession();
      },
      stopAutoRefresh: async () => {},
    },
  };
}
