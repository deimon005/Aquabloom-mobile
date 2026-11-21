import { supabase } from '../../../infrastructure/auth/supabase';
import type { LoginCredentials } from '../domain/loginSchema';

export class AuthConfigurationError extends Error {
  constructor() {
    super('Supabase no está configurado.');
    this.name = 'AuthConfigurationError';
  }
}

export async function signInWithPassword(
  credentials: LoginCredentials,
  client = supabase,
) {
  if (!client) throw new AuthConfigurationError();

  const { error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
}
