import { Text } from 'react-native';
import { screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { Redirect } from 'expo-router';
import { RequireSession } from '../RequireSession';
import { useCurrentUser } from '../useCurrentUser';
import { sessionFor } from './authFixture';
import { loginDestination } from '../loginDestination';

jest.mock('../useCurrentUser');
jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null) }));
const state = (overrides: Partial<ReturnType<typeof useCurrentUser>> = {}) => {
  jest.mocked(useCurrentUser).mockReturnValue({
    user: null,
    status: 'ready',
    error: null,
    retry: jest.fn(),
    signOut: jest.fn(),
    isSigningOut: false,
    signOutError: null,
    ...overrides,
  });
};
it('redirects anonymous access without mounting private content', async () => {
  state();
  await render(
    <RequireSession>
      <Text>Private account</Text>
    </RequireSession>,
  );
  expect(screen.queryByText('Private account')).toBeNull();
  expect(jest.mocked(Redirect).mock.calls[0][0].href).toEqual({
    pathname: '/login',
    params: { returnTo: '/profile' },
  });
});
it('waits for restoration and removes private content after logout', async () => {
  state({ status: 'loading' });
  const tree = () => (
    <RequireSession>
      <Text>Private account</Text>
    </RequireSession>
  );
  const view = await render(tree());
  expect(Redirect).not.toHaveBeenCalled();
  expect(screen.queryByText('Private account')).toBeNull();
  state({ user: sessionFor().user });
  await view.rerender(tree());
  expect(screen.getByText('Private account')).toBeTruthy();
  state();
  await view.rerender(tree());
  expect(screen.queryByText('Private account')).toBeNull();
  expect(Redirect).toHaveBeenCalled();
});
it.each([
  '/profile',
  'https://evil.example',
  '//evil.example',
  '/login',
  undefined,
])('allows only a known post-login destination: %s', (value) => {
  expect(loginDestination(value)).toBe(value === '/profile' ? '/profile' : '/');
});

it('returns to an observation only for a strict internal lake UUID', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  expect(loginDestination(`/lakes/${id}/observations`)).toEqual({
    pathname: '/lakes/[id]/observations',
    params: { id },
  });
  for (const path of [
    '/lakes/invalid/observations',
    `/lakes/${id}/observations?redirect=evil`,
    `https://evil.example/lakes/${id}/observations`,
    [`/lakes/${id}/observations`],
  ]) {
    expect(loginDestination(path)).toBe('/');
  }
});

it('only accepts known scientific destinations with UUIDs, without query/open redirects', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  expect(loginDestination(`/lakes/${id}/estimates`)).toEqual({
    pathname: '/lakes/[id]/estimates',
    params: { id },
  });
  expect(loginDestination(`/lakes/${id}/estimates/${id}`)).toEqual({
    pathname: '/lakes/[id]/estimates/[estimateId]',
    params: { id, estimateId: id },
  });
  expect(loginDestination(`/scientific/jobs/${id}`)).toEqual({
    pathname: '/scientific/jobs/[jobId]',
    params: { jobId: id },
  });
  for (const path of [
    `/lakes/${id}/estimates?redirect=evil`,
    `/lakes/${id}/estimates/invalid`,
    '/scientific/jobs/invalid',
    `//evil/scientific/jobs/${id}`,
    `/scientific/jobs/${id}/extra`,
  ])
    expect(loginDestination(path)).toBe('/');
});
