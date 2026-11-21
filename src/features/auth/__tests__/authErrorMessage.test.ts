import { getAuthErrorMessage } from '../presentation/authErrorMessage';
import { AuthConfigurationError } from '../application/signIn';

it.each([
  [
    new AuthConfigurationError(),
    'El inicio de sesión todavía no está configurado en este dispositivo.',
  ],
  [
    { code: 'invalid_credentials' },
    'El correo o la contraseña son incorrectos.',
  ],
  [
    { code: 'email_not_confirmed' },
    'Confirma tu correo electrónico antes de iniciar sesión.',
  ],
  [
    { status: 429 },
    'Se realizaron demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  ],
  [
    new TypeError('Network request failed'),
    'No pudimos conectarnos. Revisa tu conexión a internet e inténtalo nuevamente.',
  ],
  [
    new Error('internal detail'),
    'No se pudo iniciar sesión. Inténtalo nuevamente.',
  ],
])('returns a safe user-facing message for %#', (failure, expected) => {
  expect(getAuthErrorMessage(failure)).toBe(expected);
});
