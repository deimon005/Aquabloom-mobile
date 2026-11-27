import { createClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { AuthProvider, useCurrentUser } from '../AuthProvider';
import { LoginForm } from '../LoginForm';
import { ProfileScreen } from '../ProfileScreen';
import { signInWithPassword } from '../../../application/auth/signIn';
import { sessionFor } from './authFixture';

jest.mock('../../../infrastructure/auth/supabase', () => ({ supabase: null }));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
}));

function integrationClient() {
  const session = sessionFor();
  const transport = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/token?grant_type=password')) {
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/logout?scope=local')) {
      return new Response('{}', { status: 200 });
    }
    throw new Error('Unexpected auth request: ' + url);
  });
  const client = createClient(
    'https://auth.example.com',
    'sb_publishable_test',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: transport },
    },
  );
  return { client, transport };
}

async function setup() {
  const { client, transport } = integrationClient();
  const cache = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
  function Flow() {
    const { user } = useCurrentUser();
    return user ? (
      <ProfileScreen />
    ) : (
      <LoginForm
        onSubmit={(credentials) => signInWithPassword(credentials, client)}
      />
    );
  }
  const view = await render(
    <QueryClientProvider client={cache}>
      <AuthProvider client={client}>
        <Flow />
      </AuthProvider>
    </QueryClientProvider>,
  );
  await screen.findByText('Iniciar sesión');
  return { client, transport, cache, view };
}

async function login() {
  await fireEvent.changeText(
    screen.getByLabelText('Correo electrónico'),
    'jose@example.com',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Contraseña'),
    'test-password',
  );
  await fireEvent.press(screen.getByText('Iniciar sesión'));
}

it('integrates login, Supabase auth events, profile and logout with cache cleanup', async () => {
  const { client, transport, cache, view } = await setup();
  await login();
  expect(await screen.findByText('jose@example.com')).toBeTruthy();
  expect((await client.auth.getSession()).data.session?.user.id).toBe('jose');
  cache.setQueryData(['lakes', 'private'], { name: 'cached lake' });
  await fireEvent.press(screen.getByText('Cerrar sesión'));
  await screen.findByText('Iniciar sesión');
  expect(screen.queryByText('jose@example.com')).toBeNull();
  expect((await client.auth.getSession()).data.session).toBeNull();
  expect(cache.getQueryCache().getAll()).toHaveLength(0);
  expect(transport.mock.calls.map(([url]) => String(url))).toEqual([
    'https://auth.example.com/auth/v1/token?grant_type=password',
    'https://auth.example.com/auth/v1/logout?scope=local',
  ]);
  await view.unmount();
});

it('shows an authentication failure without creating a session or showing the profile', async () => {
  const { client, transport, view } = await setup();
  transport.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    ),
  );
  await login();
  expect(
    await screen.findByText('El correo o la contraseña son incorrectos.'),
  ).toBeTruthy();
  expect(screen.queryByText('Cerrar sesión')).toBeNull();
  expect((await client.auth.getSession()).data.session).toBeNull();
  await view.unmount();
});

it('handles a Supabase logout event initiated outside the profile', async () => {
  const { client, cache, view } = await setup();
  await login();
  await screen.findByText('jose@example.com');
  cache.setQueryData(['private'], 'private value');
  await act(async () => {
    await client.auth.signOut({ scope: 'local' });
  });
  await waitFor(() => expect(screen.getByText('Iniciar sesión')).toBeTruthy());
  expect(cache.getQueryData(['private'])).toBeUndefined();
  expect(screen.queryByText('Cerrar sesión')).toBeNull();
  await view.unmount();
});
