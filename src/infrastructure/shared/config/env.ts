import { z } from 'zod';

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' ? value.trim() || undefined : value;
const optionalUrl = z.preprocess(
  blankToUndefined,
  z
    .url({ protocol: /^https?$/ })
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
    authProvider: z.preprocess(
      blankToUndefined,
      z.enum(['local', 'supabase']).default('supabase'),
    ),
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

export function parseEnv(input: unknown, isDevelopment = __DEV__) {
  return schema
    .superRefine((value, context) => {
      if (
        value.authProvider === 'local' &&
        (!isDevelopment ||
          !value.apiUrl ||
          !value.apiUrl.replace(/\/$/, '').endsWith('/api/v1'))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['authProvider'],
          message:
            'La autenticación local requiere desarrollo y una API configurada.',
        });
      }
    })
    .safeParse(input);
}

// Expo requires direct property access to inline public variables.
export const environment = parseEnv({
  authProvider: process.env.EXPO_PUBLIC_AUTH_PROVIDER,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
export const env: Partial<z.infer<typeof schema>> = environment.success
  ? environment.data
  : {};
