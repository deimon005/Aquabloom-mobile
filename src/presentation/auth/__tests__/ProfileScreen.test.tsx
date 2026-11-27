import { fireEvent, screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthError } from '@supabase/supabase-js';
import { AuthProvider, type AuthClient } from '../AuthProvider';
import { ProfileScreen } from '../ProfileScreen';
import { authFixture, sessionFor } from './authFixture';

jest.mock('../../../infrastructure/auth/supabase', () => ({ supabase: null }));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
}));

async function mount(client: AuthClient | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={client}>
        <ProfileScreen />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return queryClient;
}

it('displays the authenticated user without exposing session tokens', async () => {
  await mount(authFixture(sessionFor()).client);
  expect(await screen.findByText('José Jiménez')).toBeTruthy();
  expect(screen.getByText('jose@example.com')).toBeTruthy();
  expect(screen.queryByText('test-token')).toBeNull();
  expect(screen.queryByText('test-refresh')).toBeNull();
});

it('handles missing optional profile fields without inventing data', async () => {
  const session = sessionFor();
  session.user.user_metadata = { full_name: { invalid: true } };
  delete session.user.email;
  await mount(authFixture(session).client);
  expect(await screen.findByText('Tu cuenta')).toBeTruthy();
  expect(screen.getByText('No disponible')).toBeTruthy();
  expect(screen.queryByText('Teléfono')).toBeNull();
});

it('invites anonymous users to sign in', async () => {
  await mount(authFixture().client);
  expect(
    await screen.findByText('Inicia sesión para ver tu perfil.'),
  ).toBeTruthy();
  expect(screen.getByText('Iniciar sesión').props.href).toBe('/login');
  expect(screen.getByText('Crear cuenta').props.href).toBe('/register');
  expect(screen.queryByText('Cerrar sesión')).toBeNull();
});

it('shows a server-assigned actor and ignores a self-assigned role', async () => {
  const session = sessionFor();
  session.user.app_metadata = { role: 'supervisor' };
  session.user.user_metadata.role = 'administrador';
  await mount(authFixture(session).client);
  expect(await screen.findByText('Supervisor')).toBeTruthy();
  expect(screen.queryByText('Administrador')).toBeNull();
});

it('explains missing configuration without offering a broken login', async () => {
  await mount(null);
  expect(
    screen.getByText(
      'El inicio de sesión aún no está disponible. Contacta al equipo de AquaBloom.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('Iniciar sesión')).toBeNull();
});

it('signs out from the profile and removes private data', async () => {
  const auth = authFixture(sessionFor());
  const cache = await mount(auth.client);
  await screen.findByText('jose@example.com');
  cache.setQueryData(['private'], 'sensitive');
  await fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(
    await screen.findByText('Inicia sesión para ver tu perfil.'),
  ).toBeTruthy();
  expect(screen.queryByText('jose@example.com')).toBeNull();
  expect(cache.getQueryData(['private'])).toBeUndefined();
});

it('keeps the session on logout failure and lets the user retry', async () => {
  const auth = authFixture(sessionFor());
  auth.signOut.mockResolvedValueOnce({
    error: new AuthError('internal error with private details'),
  });
  await mount(auth.client);
  await screen.findByText('jose@example.com');
  await fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(
    await screen.findByText(
      'No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.',
    ),
  ).toBeTruthy();
  expect(screen.getByText('jose@example.com')).toBeTruthy();
  expect(screen.queryByText('internal error with private details')).toBeNull();
  await fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(
    await screen.findByText('Inicia sesión para ver tu perfil.'),
  ).toBeTruthy();
});

it('still shows an unconfirmed logout warning after the local session is cleared', async () => {
  const auth = authFixture(sessionFor());
  auth.signOut.mockImplementationOnce(async () => {
    auth.emit('SIGNED_OUT', null);
    return { error: new Error('unconfirmed revocation') };
  });
  await mount(auth.client);
  await screen.findByText('jose@example.com');
  await fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(
    await screen.findByText('Inicia sesión para ver tu perfil.'),
  ).toBeTruthy();
  expect(
    screen.getByText(
      'No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('unconfirmed revocation')).toBeNull();
});
