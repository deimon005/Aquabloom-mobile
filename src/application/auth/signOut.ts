import {
  AuthConfigurationError,
  type AuthClient,
  type SessionCache,
} from '../../domain/auth/auth';

export async function signOutAndClearCache(
  client: AuthClient | null,
  queryClient: SessionCache,
  clearCatalogCache: () => Promise<void>,
) {
  await queryClient.cancelQueries();
  queryClient.clear();
  try {
    // Do not report successful logout if persisted data cannot be removed.
    await clearCatalogCache();
    if (!client) throw new AuthConfigurationError();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  } finally {
    // A late response must not restore cached data during sign-out.
    await queryClient.cancelQueries();
    queryClient.clear();
  }
}
