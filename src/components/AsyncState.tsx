import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';
import { AppButton } from './AppButton';

export function AsyncState({
  kind,
  message,
  onRetry,
  retrying = false,
}: {
  kind: 'loading' | 'error' | 'empty';
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
      accessibilityState={{ busy: kind === 'loading' || retrying }}
      style={styles.container}
    >
      {kind === 'loading' && (
        <ActivityIndicator
          accessible
          accessibilityLabel="Cargando"
          accessibilityRole="progressbar"
          accessibilityState={{ busy: true }}
          color={tokens.colors.primary}
        />
      )}
      <Text
        accessibilityRole={kind === 'error' ? 'alert' : undefined}
        style={{
          color: kind === 'error' ? tokens.colors.error : tokens.colors.muted,
        }}
      >
        {message}
      </Text>
      {kind === 'error' && onRetry && (
        <AppButton
          accessibilityHint="Vuelve a ejecutar la operación que falló"
          disabled={retrying}
          onPress={onRetry}
        >
          {retrying ? 'Reintentando…' : 'Reintentar'}
        </AppButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: tokens.spacing.md },
});
