import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { AuthClient } from '../AuthProvider';

export function sessionFor(id = 'jose', email = 'jose@example.com'): Session {
  const user: User = {
    id,
    email,
    aud: 'authenticated',
    created_at: '2026-09-01T00:00:00Z',
    app_metadata: {},
    user_metadata: { full_name: 'José Jiménez' },
  };
  return {
    user,
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
  };
}

export function authFixture(session: Session | null = null) {
  let listener:
    Parameters<AuthClient['auth']['onAuthStateChange']>[0] | undefined;
  const unsubscribe = jest.fn();
  const getSession = jest
    .fn<ReturnType<AuthClient['auth']['getSession']>, []>()
    .mockResolvedValue(
      session
        ? { data: { session }, error: null }
        : { data: { session: null }, error: null },
    );
  const signOut = jest
    .fn<
      ReturnType<AuthClient['auth']['signOut']>,
      Parameters<AuthClient['auth']['signOut']>
    >()
    .mockImplementation(async () => {
      listener?.('SIGNED_OUT', null);
      return { error: null };
    });
  const onAuthStateChange = jest
    .fn<
      ReturnType<AuthClient['auth']['onAuthStateChange']>,
      Parameters<AuthClient['auth']['onAuthStateChange']>
    >()
    .mockImplementation((callback) => {
      listener = callback;
      return { data: { subscription: { id: 'test', callback, unsubscribe } } };
    });
  const client: AuthClient = {
    auth: { getSession, signOut, onAuthStateChange },
  };
  return {
    client,
    getSession,
    signOut,
    unsubscribe,
    emit: (event: AuthChangeEvent, next: Session | null) =>
      listener?.(event, next),
  };
}
