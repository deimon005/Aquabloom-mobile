import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AsyncState } from '../shared/components/AsyncState';
import { Screen } from '../shared/components/Screen';
import { tokens } from '../shared/theme/tokens';
import { useCurrentUser } from './useCurrentUser';
import { actorLabel } from '../../domain/auth/roles';
import { AppIcon } from '../shared/components/AppIcon';
import { AppButton } from '../shared/components/AppButton';
import { useAppServices } from '../shared/services/AppServicesProvider';

export function ProfileScreen() {
  const { config } = useAppServices();
  const { user, status, error, retry, signOut, signOutError } =
    useCurrentUser();
  const name = user?.user_metadata?.full_name;
  return (
    <Screen
      title="Mi perfil"
      subtitle="Tu identidad y tu espacio en la comunidad AquaBloom."
    >
      {config?.authProvider === 'local' ? (
        <Text>Entorno local de pruebas</Text>
      ) : null}
      {status === 'loading' ? (
        <AsyncState kind="loading" message="Cargando sesión…" />
      ) : status === 'error' ? (
        <AsyncState
          kind="error"
          message={error ?? 'No pudimos cargar tu sesión.'}
          onRetry={retry}
        />
      ) : status === 'unconfigured' ? (
        <AsyncState
          kind="empty"
          message="El inicio de sesión aún no está disponible. Contacta al equipo de AquaBloom."
        />
      ) : !user ? (
        <View style={styles.guestCard}>
          <View style={styles.avatar}>
            <AppIcon name="user" size={28} />
          </View>
          <Text style={styles.guestTitle}>Un espacio para colaborar</Text>
          <Text style={styles.guestDescription}>
            Inicia sesión para ver tu perfil.
          </Text>
          <Link style={styles.primaryLink} href="/register">
            Crear cuenta
          </Link>
          <Link style={styles.secondaryLink} href="/login">
            Iniciar sesión
          </Link>
          <View style={styles.privacy}>
            <AppIcon name="shield" size={16} />
            <Text style={styles.privacyText}>
              Tu cuenta, tus observaciones y tu comunidad.
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <AppIcon name="user" size={28} />
            </View>
            <Text accessibilityRole="header" style={styles.name}>
              {typeof name === 'string' && name.trim()
                ? name.trim()
                : 'Tu cuenta'}
            </Text>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text selectable style={styles.value}>
              {user.email || 'No disponible'}
            </Text>
            <Text style={styles.label}>Rol</Text>
            <Text style={styles.roleBadge}>
              {actorLabel(user.app_metadata)}
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
          <AppButton variant="secondary" onPress={() => void signOut()}>
            Cerrar sesión
          </AppButton>
        </>
      )}
      {signOutError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {signOutError}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadow,
  },
  name: { fontSize: 24, fontWeight: '700', color: tokens.colors.heading },
  label: {
    color: tokens.colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: tokens.spacing.sm,
  },
  value: { color: tokens.colors.text, fontSize: 16 },
  error: { color: tokens.colors.error },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: tokens.colors.primarySoft,
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  guestCard: {
    borderRadius: tokens.radius,
    padding: 24,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 14,
    ...tokens.shadow,
  },
  guestTitle: {
    color: tokens.colors.heading,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  guestDescription: {
    color: tokens.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  primaryLink: {
    backgroundColor: tokens.colors.primary,
    color: '#FFFFFF',
    borderRadius: tokens.radiusSmall,
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryLink: {
    borderWidth: 1,
    borderColor: tokens.colors.borderStrong,
    color: tokens.colors.heading,
    borderRadius: tokens.radiusSmall,
    paddingVertical: 15,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 7,
  },
  privacyText: {
    flex: 1,
    color: tokens.colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
