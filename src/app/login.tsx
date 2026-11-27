import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../presentation/shared/components/Screen';
import { LoginForm } from '../presentation/auth/LoginForm';
import { useAppServices } from '../presentation/shared/services/AppServicesProvider';
import { useCurrentUser } from '../presentation/auth/useCurrentUser';
import { loginDestination } from '../presentation/auth/loginDestination';
import { AsyncState } from '../presentation/shared/components/AsyncState';
import { tokens } from '../presentation/shared/theme/tokens';

export default function Login() {
  const {
    auth: { signInWithPassword },
    config,
  } = useAppServices();
  const { user, status } = useCurrentUser();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  if (user) return <Redirect href={loginDestination(returnTo ?? '/profile')} />;
  return (
    <Screen
      title="Iniciar sesión"
      subtitle="Accede a tu espacio de colaboración y continúa tus observaciones."
    >
      {status === 'unconfigured' ? (
        <AsyncState
          kind="empty"
          message="El inicio de sesión aún no está disponible. Contacta al equipo de AquaBloom."
        />
      ) : (
        <>
          <LoginForm
            onSubmit={signInWithPassword}
            localEnvironment={config?.authProvider === 'local'}
          />
          <Link
            style={{
              color: tokens.colors.primary,
              textAlign: 'center',
              padding: 14,
              fontWeight: '700',
              fontSize: 15,
            }}
            href={{
              pathname: '/register',
              params: {
                returnTo: typeof returnTo === 'string' ? returnTo : '/profile',
              },
            }}
          >
            Crear cuenta
          </Link>
        </>
      )}
    </Screen>
  );
}
