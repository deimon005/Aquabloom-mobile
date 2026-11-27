import { getAuthErrorMessage } from './authErrorMessage';
export function getRegistrationErrorMessage(error: unknown) {
  const failure =
    typeof error === 'object' && error !== null
      ? (error as { code?: string })
      : {};
  if (failure.code === 'user_already_exists' || failure.code === 'email_exists')
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  if (failure.code === 'weak_password')
    return 'La contraseña no cumple los requisitos. Usa una contraseña más larga.';
  if (failure.code === 'signup_disabled')
    return 'El registro no está disponible en este momento.';
  const message = getAuthErrorMessage(error);
  return message === 'No se pudo iniciar sesión. Inténtalo nuevamente.'
    ? 'No se pudo crear la cuenta. Inténtalo nuevamente.'
    : message;
}
