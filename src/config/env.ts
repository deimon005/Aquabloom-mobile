import { z } from 'zod';
import { androidQa, qaApiUrl, qaAuthUrl } from './androidQa';

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' ? value.trim() || undefined : value;
const optionalUrl = z.preprocess(
  blankToUndefined,
  z
    .httpUrl()
    .refine((value) => {
      try {
        const url = new URL(value);
        return !url.username && !url.password && !url.search && !url.hash;
      } catch {
        return false;
      }
    }, 'Usa una URL sin credenciales, parámetros ni fragmentos.')
    .optional(),
);
const schema = z
  .object({
    apiUrl: optionalUrl,
    supabaseUrl: optionalUrl,
    supabaseKey: z.preprocess(blankToUndefined, z.string().optional()),
  })
  .refine(
    (value) => Boolean(value.supabaseUrl) === Boolean(value.supabaseKey),
    {
      message: 'Configura tanto la URL como la clave pública de Supabase.',
      path: ['supabaseKey'],
    },
  );

export function parseEnv(input: unknown) {
  return schema.safeParse(input);
}

// Expo requires direct property access to inline public variables.
export const environment = parseEnv(
  androidQa
    ? {
        apiUrl: qaApiUrl,
        supabaseUrl: qaAuthUrl,
        supabaseKey: 'sb_publishable_aquabloom_qa',
      }
    : {
        apiUrl: process.env.EXPO_PUBLIC_API_URL,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
);
export const env = environment.success ? environment.data : {};
