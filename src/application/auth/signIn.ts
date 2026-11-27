import type { PasswordClient } from '../../domain/auth/auth';
import { AuthConfigurationError } from '../../domain/auth/auth';
import type { LoginCredentials } from '../../domain/auth/loginSchema';
export { AuthConfigurationError } from '../../domain/auth/auth';

export async function signInWithPassword(
  credentials: LoginCredentials,
  client: PasswordClient | null,
) {
  if (!client) throw new AuthConfigurationError();

  const { error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
}
