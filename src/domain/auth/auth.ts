import type { LoginCredentials } from './loginSchema';
export type AuthUser = {
  id: string;
  email?: string;
  phone?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
};
export type AuthSession = { user: AuthUser; access_token?: string };
export type AuthClient = {
  auth: {
    getSession: () => Promise<{
      data: { session: AuthSession | null };
      error: unknown;
    }>;
    onAuthStateChange: (
      listener: (event: string, session: AuthSession | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
    signOut: (options: { scope: 'local' }) => Promise<{ error: unknown }>;
  };
};
export type PasswordClient = {
  auth: {
    signInWithPassword: (
      credentials: LoginCredentials,
    ) => Promise<{ error: unknown }>;
  };
};
export type SessionRefresh = {
  startAutoRefresh: () => Promise<void>;
  stopAutoRefresh: () => Promise<void>;
};
export type SessionCache = {
  cancelQueries: () => Promise<unknown>;
  clear: () => void;
};
export class AuthConfigurationError extends Error {
  constructor() {
    super('El proveedor de autenticación no está configurado.');
    this.name = 'AuthConfigurationError';
  }
}
