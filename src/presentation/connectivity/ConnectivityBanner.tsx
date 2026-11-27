import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConnectivity } from './ConnectivityProvider';
import { tokens } from '../shared/theme/tokens';
import type { ConnectivityStatus } from '../../domain/connectivity/connectivity';

type ConnectivityBannerProps = {
  status?: ConnectivityStatus;
};

export function ConnectivityBanner({
  status: statusOverride,
}: ConnectivityBannerProps) {
  const observedStatus = useConnectivity();
  const status = statusOverride ?? observedStatus;

  if (status !== 'offline') return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View
        accessible
        accessibilityLabel="Sin conexión. Mostrando información disponible; los datos se actualizarán cuando vuelva internet."
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        style={styles.banner}
      >
        <Text style={styles.title}>Sin conexión</Text>
        <Text style={styles.message}>
          Mostrando información disponible. Actualizaremos los datos cuando
          vuelva internet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: tokens.colors.error },
  banner: {
    minHeight: 48,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.error,
  },
  title: {
    color: tokens.colors.surface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: tokens.colors.surface,
    lineHeight: 20,
    textAlign: 'center',
  },
});
