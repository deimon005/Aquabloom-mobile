import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { AsyncState } from '../../components/AsyncState';
import { Screen } from '../../components/Screen';
import { supabase } from '../../lib/supabase';
import { signOutAndClearCache } from './signOut';
import { setCatalogIdentity } from '../offline/data/catalogCache';

export type AuthClient = {
  auth: Pick<
    SupabaseClient['auth'],
    'getSession' | 'onAuthStateChange' | 'signOut'
  >;
};

type AuthState = {
  user: User | null;
  status: 'loading' | 'ready' | 'error' | 'unconfigured';
  error: string | null;
};

type AuthContextValue = AuthState & {
  retry: () => void;
  signOut: () => Promise<boolean>;
  isSigningOut: boolean;
  signOutError: string | null;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  client = supabase,
}: PropsWithChildren<{ client?: AuthClient | null }>) {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const pendingSignOut = useRef<Promise<boolean> | null>(null);
  const [state, setState] = useState<AuthState>({
    user: null,
    status: client ? 'loading' : 'unconfigured',
    error: null,
  });
  const retry = useCallback(() => {
    setState({ user: null, status: 'loading', error: null });
    setAttempt((value) => value + 1);
  }, []);

  const signOut = useCallback(() => {
    if (pendingSignOut.current) return pendingSignOut.current;
    setIsSigningOut(true);
    setSignOutError(null);
    const operation = signOutAndClearCache(client, queryClient)
      .then(() => {
        setState({
          user: null,
          status: client ? 'ready' : 'unconfigured',
          error: null,
        });
        return true;
      })
      .catch(() => {
        setSignOutError(
          'No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.',
        );
        return false;
      })
      .finally(() => {
        pendingSignOut.current = null;
        setIsSigningOut(false);
      });
    pendingSignOut.current = operation;
    return operation;
  }, [client, queryClient]);

  useEffect(() => {
    let active = true;
    let revision = 0;
    let identity: string | null | undefined;
    setCatalogIdentity(null);
    if (!client) return;
    queryClient.clear();

    const applySession = (session: Session | null) => {
      if (!active) return;
      const user = session?.user ?? null;
      if (identity !== user?.id) {
        // Removing queries also cancels pending requests before another account
        // can observe their data. Same-user refreshes preserve the cache.
        queryClient.clear();
        identity = user?.id;
        setCatalogIdentity(user?.id ?? null);
      }
      setState({ user, status: 'ready', error: null });
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      revision += 1;
      applySession(session);
    });
    const initialRevision = revision;
    void client.auth
      .getSession()
      .then(({ data, error }) => {
        // An auth event is newer than the initial read, even if it arrives first.
        if (!active || revision !== initialRevision) return;
        if (error) throw error;
        applySession(data.session);
      })
      .catch(() => {
        if (!active || revision !== initialRevision) return;
        setState({
          user: null,
          status: 'error',
          error: 'No pudimos cargar tu sesión. Inténtalo nuevamente.',
        });
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client, queryClient, attempt]);

  return (
    <AuthContext.Provider
      value={{ ...state, retry, signOut, isSigningOut, signOutError }}
    >
      {state.status === 'loading' || isSigningOut ? (
        <Screen title="AquaBloom">
          <AsyncState
            kind="loading"
            message={isSigningOut ? 'Cerrando sesión…' : 'Cargando sesión…'}
          />
        </Screen>
      ) : state.status === 'error' ? (
        <Screen title="AquaBloom">
          <AsyncState kind="error" message={state.error!} onRetry={retry} />
        </Screen>
      ) : (
        <Fragment key={state.user?.id ?? 'anonymous'}>{children}</Fragment>
      )}
    </AuthContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useCurrentUser requiere AuthProvider.');
  return context;
}
