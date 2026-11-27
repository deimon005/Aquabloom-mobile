import { AuthConfigurationError } from '../../domain/auth/auth';
import type {
  RegistrationClient,
  RegistrationCredentials,
  RegistrationResult,
} from '../../domain/auth/registration';

export async function signUpWithPassword(
  credentials: RegistrationCredentials,
  client: RegistrationClient | null,
): Promise<RegistrationResult> {
  if (!client) throw new AuthConfigurationError();
  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: { data: { full_name: credentials.fullName } },
  });
  if (error) throw error;
  return { requiresEmailConfirmation: data.session === null };
}
