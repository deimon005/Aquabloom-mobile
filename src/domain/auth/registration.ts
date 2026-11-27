import { z } from 'zod';
import type { AuthSession } from './auth';

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Ingresa tu nombre completo.').max(120),
    email: z.string().trim().email('Ingresa un correo electrónico válido.'),
    password: z
      .string()
      .min(15, 'Usa al menos 15 caracteres.')
      .max(256, 'Usa como máximo 256 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type RegistrationValues = z.infer<typeof registrationSchema>;
export type RegistrationCredentials = Pick<
  RegistrationValues,
  'fullName' | 'email' | 'password'
>;
export type RegistrationResult = { requiresEmailConfirmation: boolean };
export type RegistrationClient = {
  auth: {
    signUp: (input: {
      email: string;
      password: string;
      options: { data: { full_name: string } };
    }) => Promise<{
      data: { session: AuthSession | null };
      error: unknown;
    }>;
  };
};
