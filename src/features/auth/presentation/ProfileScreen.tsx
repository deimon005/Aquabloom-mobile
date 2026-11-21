import { Link } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AsyncState } from '../../../components/AsyncState';
import { Screen } from '../../../components/Screen';
import { tokens } from '../../../theme/tokens';
import { useCurrentUser } from '../application/useCurrentUser';

export function ProfileScreen() {
  const { user, status, signOut, signOutError } = useCurrentUser();
  const name = user?.user_metadata.full_name;
  return (
    <Screen title="Perfil">
      {status === 'unconfigured' ? (
        <AsyncState
          kind="empty"
          message="El inicio de sesión aún no está disponible. Contacta al equipo de AquaBloom."
        />
      ) : !user ? (
        <>
          <AsyncState
            kind="empty"
            message="Inicia sesión para ver tu perfil."
          />
          <Link href="/login">Iniciar sesión</Link>
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.name}>
              {typeof name === 'string' && name.trim()
                ? name.trim()
                : 'Tu cuenta'}
            </Text>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text selectable style={styles.value}>
              {user.email || 'No disponible'}
            </Text>
            {user.phone ? (
              <>
                <Text style={styles.label}>Teléfono</Text>
                <Text selectable style={styles.value}>
                  {user.phone}
                </Text>
              </>
            ) : null}
          </View>
          {signOutError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {signOutError}
            </Text>
          ) : null}
          <Button title="Cerrar sesión" onPress={() => void signOut()} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
  },
  name: { fontSize: 22, fontWeight: '600', color: tokens.colors.text },
  label: {
    color: tokens.colors.muted,
    fontSize: 14,
    marginTop: tokens.spacing.sm,
  },
  value: { color: tokens.colors.text, fontSize: 16 },
  error: { color: tokens.colors.error },
});
