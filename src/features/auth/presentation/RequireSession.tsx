import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useCurrentUser } from '../application/useCurrentUser';
import { AsyncState } from '../../../components/AsyncState';
import { Screen } from '../../../components/Screen';

export function RequireSession({
  children,
  returnTo = '/profile',
}: PropsWithChildren<{ returnTo?: string }>) {
  const { user, status, error, retry } = useCurrentUser();
  if (status === 'loading')
    return (
      <Screen title="Tu cuenta">
        <AsyncState kind="loading" message="Cargando sesión…" />
      </Screen>
    );
  if (status === 'error')
    return (
      <Screen title="Tu cuenta">
        <AsyncState
          kind="error"
          message={error ?? 'No pudimos cargar tu sesión.'}
          onRetry={retry}
        />
      </Screen>
    );
  if (!user)
    return <Redirect href={{ pathname: '/login', params: { returnTo } }} />;
  return children;
}
