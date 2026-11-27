import { Text } from 'react-native';
import { tokens } from '../shared/theme/tokens';
export function OfflineNotice({ savedAt }: { savedAt?: number }) {
  return (
    <Text accessibilityRole="alert" style={{ color: tokens.colors.muted }}>
      Sin conexión. Mostrando datos guardados
      {savedAt ? ' el ' + new Date(savedAt).toLocaleString('es-CL') : ''}.
    </Text>
  );
}
