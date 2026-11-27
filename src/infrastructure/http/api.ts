import { androidQa } from '../../config/androidQa';
import { androidQaFetch } from './androidQaFetch';
import { env } from '../../config/env';
import { createHttpClient } from './http';
import { supabase } from '../auth/supabase';

export const api = env.apiUrl
  ? createHttpClient(
      env.apiUrl,
      async () => {
        const result = await supabase?.auth.getSession();
        return result?.data.session?.access_token ?? null;
      },
      androidQa ? androidQaFetch : undefined,
    )
  : null;
