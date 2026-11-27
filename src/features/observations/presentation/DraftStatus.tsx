import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../../theme/tokens';
import type { DraftPhase } from './ObservationForm';

export function DraftStatus({
  phase,
  savedAt,
  durability,
  captureStatus,
}: {
  phase: DraftPhase;
  savedAt: string | null;
  durability: 'device' | 'session';
  captureStatus: string;
}) {
  return (
    <View style={styles.status}>
      <Text accessibilityLiveRegion="polite" style={styles.heading}>
        {phase === 'saving'
          ? 'Guardando borrador…'
          : phase === 'saved'
            ? 'Guardado local · Pendiente de envío'
            : 'En edición · Cambios sin guardar'}
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.text}>
        {captureStatus}
      </Text>
      <Text style={styles.text}>Sin envío al servidor · No validado</Text>
      {phase === 'editing' && savedAt ? (
        <Text style={styles.text}>
          Los cambios actuales aún no reemplazan el último borrador guardado.
        </Text>
      ) : null}
      {savedAt ? (
        <Text style={styles.text}>
          Último guardado: {new Date(savedAt).toLocaleString('es-CL')}
        </Text>
      ) : null}
      {durability === 'session' ? (
        <Text style={styles.text}>
          Vista web: guardado sólo durante esta sesión; al recargar se pierde.
          Android/iOS guarda en el dispositivo.
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  status: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius,
  },
  heading: { color: tokens.colors.primary, fontWeight: '700', fontSize: 16 },
  text: { color: tokens.colors.muted },
});
