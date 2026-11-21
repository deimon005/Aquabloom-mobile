import { Redirect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../components/Screen';
import { LoginForm } from '../features/auth/presentation/LoginForm';
import { signInWithPassword } from '../features/auth/application/signIn';
import { useCurrentUser } from '../features/auth/application/useCurrentUser';
import { loginDestination } from '../features/auth/application/loginDestination';
import { AsyncState } from '../components/AsyncState';

export default function Login() {
  const { user, status } = useCurrentUser();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  if (user) return <Redirect href={loginDestination(returnTo)} />;
  return (
    <Screen title="Iniciar sesión">
      {status === 'unconfigured' ? (
        <AsyncState
          kind="empty"
          message="El inicio de sesión aún no está disponible. Contacta al equipo de AquaBloom."
        />
      ) : (
        <LoginForm onSubmit={signInWithPassword} />
      )}
    </Screen>
  );
}
