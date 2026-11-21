import type { QueryClient } from '@tanstack/react-query';
import type { AuthClient } from './AuthProvider';
import { AuthConfigurationError } from './signIn';
import { clearCatalogCache } from '../offline/data/catalogCache';

export async function signOutAndClearCache(
  client: AuthClient | null,
  queryClient: QueryClient,
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
