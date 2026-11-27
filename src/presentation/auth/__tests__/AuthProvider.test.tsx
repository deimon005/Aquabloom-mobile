import { act, fireEvent, screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { Text } from 'react-native';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { AuthProvider, useCurrentUser, type AuthClient } from '../AuthProvider';
import { authFixture, sessionFor } from './authFixture';

jest.mock('../../../infrastructure/auth/supabase', () => ({ supabase: null }));

function CurrentUser() {
  const { user, status } = useCurrentUser();
  return <Text>{user?.email ?? status}</Text>;
}
async function mount(
  client: AuthClient | null,
  queryClient = new QueryClient(),
) {
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={client}>
        <CurrentUser />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

it('loads the current user and updates their profile on auth events', async () => {
  const auth = authFixture(sessionFor());
  await mount(auth.client);
  expect(await screen.findByText('jose@example.com')).toBeTruthy();
  await act(() =>
    auth.emit('USER_UPDATED', sessionFor('jose', 'new@example.com')),
  );
  expect(screen.getByText('new@example.com')).toBeTruthy();
});

it('starts without configuration and does not call Supabase', async () => {
  await mount(null);
  expect(screen.getByText('unconfigured')).toBeTruthy();
});

it('does not cancel public queries when Supabase is unconfigured', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  });
  function PublicContent() {
    const query = useQuery({
      queryKey: ['public'],
      queryFn: async () => 'API disponible',
    });
    return <Text>{query.data ?? 'Cargando'}</Text>;
  }
  await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider client={null}>
        <PublicContent />
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByText('API disponible')).toBeTruthy();
});

it('keeps a newer auth event when the initial read resolves late', async () => {
  const auth = authFixture();
  let resolve!: (
    value: Awaited<ReturnType<AuthClient['auth']['getSession']>>,
  ) => void;
  auth.getSession.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  await mount(auth.client);
  expect(screen.getByText('Cargando sesión…')).toBeTruthy();
  await act(() => auth.emit('SIGNED_IN', sessionFor()));
  await act(() => resolve({ data: { session: null }, error: null }));
  expect(screen.getByText('jose@example.com')).toBeTruthy();
});

it('offers retry when reading the initial session fails', async () => {
  const auth = authFixture(sessionFor());
  auth.getSession.mockRejectedValueOnce(new Error('network'));
  await mount(auth.client);
  expect(
    await screen.findByText(
      'No pudimos cargar tu sesión. Inténtalo nuevamente.',
    ),
  ).toBeTruthy();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(await screen.findByText('jose@example.com')).toBeTruthy();
});

it('clears queries on account changes but preserves them on same-user refresh', async () => {
  const auth = authFixture(sessionFor());
  const { queryClient } = await mount(auth.client);
  await screen.findByText('jose@example.com');
  queryClient.setQueryData(['private'], 'jose data');
  await act(() => auth.emit('TOKEN_REFRESHED', sessionFor()));
  expect(queryClient.getQueryData(['private'])).toBe('jose data');
  await act(() =>
    auth.emit('SIGNED_IN', sessionFor('other', 'other@example.com')),
  );
  expect(queryClient.getQueryData(['private'])).toBeUndefined();
  expect(screen.getByText('other@example.com')).toBeTruthy();
});

it('unsubscribes when the provider unmounts', async () => {
  const auth = authFixture();
  const view = await mount(auth.client);
  await view.unmount();
  expect(auth.unsubscribe).toHaveBeenCalledTimes(1);
});
