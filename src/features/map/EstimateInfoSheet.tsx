import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { EstimatePoint } from '../scientific/estimatesApi';
import { tokens } from '../../theme/tokens';

export function EstimateInfoSheet({
  estimate,
  onClose,
}: {
  estimate: EstimatePoint;
  onClose: () => void;
}) {
  return (
    <View style={styles.sheet}>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Text accessibilityRole="header" style={styles.title}>
          Estimación {estimate.point_id}
        </Text>
        <Text>
          Resultado: {estimate.value} {estimate.unit} · {estimate.variable}
        </Text>
        <Text>Fecha: {estimate.observed_at}</Text>
        <Text>Estado: {estimate.status}</Text>
        <Text>Identificador: {estimate.id}</Text>
        {estimate.warnings.map((warning, index) => (
          <Text key={`${index}-${warning}`}>Advertencia: {warning}</Text>
        ))}
        <Text style={styles.note}>
          Resultado científico por punto; no representa una superficie continua.
        </Text>
        <Button title="Cerrar estimación" onPress={onClose} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    maxHeight: '35%',
    padding: 16,
    borderTopWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  title: { fontSize: 20, fontWeight: '700', color: tokens.colors.text },
  note: { color: tokens.colors.muted },
});
