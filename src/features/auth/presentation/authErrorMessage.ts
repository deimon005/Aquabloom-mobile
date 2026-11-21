import { AuthConfigurationError } from '../application/signIn';

type AuthFailure = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

const readFailure = (error: unknown): AuthFailure =>
  typeof error === 'object' && error !== null ? error : {};

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthConfigurationError) {
    return 'El inicio de sesión todavía no está configurado en este dispositivo.';
  }

  const failure = readFailure(error);
  const code = typeof failure.code === 'string' ? failure.code : '';
  const message =
    typeof failure.message === 'string' ? failure.message.toLowerCase() : '';

  if (code === 'invalid_credentials' || message.includes('invalid login')) {
    return 'El correo o la contraseña son incorrectos.';
  }

  if (
    code === 'email_not_confirmed' ||
    message.includes('email not confirmed')
  ) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.';
  }

  if (
    failure.status === 429 ||
    code.includes('rate_limit') ||
    message.includes('too many requests')
  ) {
    return 'Se realizaron demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
  }

  if (
    error instanceof TypeError ||
    message.includes('network request failed') ||
    message.includes('failed to fetch')
  ) {
    return 'No pudimos conectarnos. Revisa tu conexión a internet e inténtalo nuevamente.';
  }

  return 'No se pudo iniciar sesión. Inténtalo nuevamente.';
}
