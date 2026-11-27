import { supabase } from '../infrastructure/auth/supabase';
import { createLocalAuthClient } from '../infrastructure/auth/localAuthClient';
import { sessionStorage } from '../infrastructure/auth/sessionStorage';
import { env } from '../infrastructure/shared/config/env';
import { signInWithPassword as signIn } from '../application/auth/signIn';
import { signUpWithPassword as signUp } from '../application/auth/signUp';
import type { RegistrationCredentials } from '../domain/auth/registration';
import { signOutAndClearCache as signOut } from '../application/auth/signOut';
import type { AuthClient, SessionCache } from '../domain/auth/auth';
import type { LoginCredentials } from '../domain/auth/loginSchema';
import { clearCatalogCache } from './catalogCache';
const selectedClient =
  env.authProvider === 'local'
    ? env.apiUrl && __DEV__
      ? createLocalAuthClient({
          baseUrl: env.apiUrl,
          isDevelopment: __DEV__,
          storage: sessionStorage,
        })
      : null
    : supabase;
export const authClient: AuthClient | null = selectedClient;
export const sessionRefresh = selectedClient?.auth ?? null;
export const signInWithPassword = (credentials: LoginCredentials) =>
  signIn(credentials, selectedClient);
export const signUpWithPassword = (credentials: RegistrationCredentials) =>
  signUp(credentials, selectedClient);
export const signOutAndClearCache = (
  client: AuthClient | null,
  cache: SessionCache,
) => signOut(client, cache, clearCatalogCache);
