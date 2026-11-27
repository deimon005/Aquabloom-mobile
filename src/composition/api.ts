import { env } from '../infrastructure/shared/config/env';
import { createHttpClient } from '../infrastructure/shared/http';
import { authClient } from './auth';

export const api = env.apiUrl
  ? createHttpClient(env.apiUrl, async () => {
      const result = await authClient?.auth.getSession();
      if (result?.error) return null;
      return result?.data.session?.access_token ?? null;
    })
  : null;
