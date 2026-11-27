import { Text, View } from 'react-native';
import type { ScientificSource } from '../../domain/scientific/source';
import { tokens } from '../shared/theme/tokens';

export function ScientificNotice({ source }: { source: ScientificSource }) {
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <Text accessibilityRole="alert" style={{ color: tokens.colors.text }}>
        {source === 'demo'
          ? 'DEMOSTRACIÓN LOCAL · Datos sintéticos. Sin consulta al servidor; no son resultados ambientales reales.'
          : 'Contrato científico propuesto · Pendiente de acuerdo con Web/API. Esta interfaz no acredita integración real.'}
      </Text>
      <Text style={{ color: tokens.colors.text, lineHeight: 24 }}>
        Las estimaciones son experimentales. Clorofila-a no equivale a toxicidad
        ni acredita agua segura. Una fotografía u observación de terreno no
        constituye una medición validada.
      </Text>
    </View>
  );
}
