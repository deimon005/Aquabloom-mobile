import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env } from '../shared/config/env';
import { sessionStorage } from './sessionStorage';

export const supabase =
  env.authProvider !== 'local' && env.supabaseUrl && env.supabaseKey
    ? createClient(env.supabaseUrl, env.supabaseKey, {
        auth: {
          storage: sessionStorage,
          persistSession: Platform.OS !== 'web',
          // SessionLifecycle owns the foreground refresh timer on mobile.
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
