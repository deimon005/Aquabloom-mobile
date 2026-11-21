import { StyleSheet, Text, View } from 'react-native';
import type { ScientificSource } from '../application/scientificSource';
import { tokens } from '../../../theme/tokens';

export function ScientificNotice({ source }: { source: ScientificSource }) {
  return (
    <View style={styles.notice}>
      <Text accessibilityRole="header" style={styles.heading}>
        {source === 'demo'
          ? 'DEMOSTRACIÓN LOCAL · Datos sintéticos. Sin consulta al servidor; no son resultados ambientales reales.'
          : 'Contrato científico propuesto · Pendiente de acuerdo con Web/API. Esta interfaz no acredita integración real.'}
      </Text>
      <Text style={styles.body}>
        Las estimaciones son experimentales. Clorofila-a no equivale a toxicidad
        ni acredita agua segura. Una fotografía u observación de terreno no
        constituye una medición validada.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
  },
  heading: { color: tokens.colors.text, fontWeight: '700', fontSize: 16 },
  body: { color: tokens.colors.text, fontSize: 16 },
});
