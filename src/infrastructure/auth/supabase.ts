import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { androidQa } from '../../config/androidQa';
import { androidQaFetch } from '../http/androidQaFetch';
import { env } from '../../config/env';
import { sessionStorage } from './sessionStorage';

export const supabase =
  env.supabaseUrl && env.supabaseKey
    ? createClient(env.supabaseUrl, env.supabaseKey, {
        ...(androidQa ? { global: { fetch: androidQaFetch } } : {}),
        auth: {
          storage: sessionStorage,
          persistSession: Platform.OS !== 'web',
          // SessionLifecycle owns the foreground refresh timer on mobile.
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
