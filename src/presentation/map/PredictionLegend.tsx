import { StyleSheet, Text, View } from 'react-native';
import {
  surfaceColor,
  surfaceRange,
  type PredictionSurface,
} from '../../domain/map/spatialData';
import { tokens } from '../shared/theme/tokens';

export function PredictionLegend({
  surface,
  example,
}: {
  surface: PredictionSurface;
  example?: boolean;
}) {
  const range = surfaceRange(surface);
  if (!range) return null;
  const variable =
    surface.variable === 'chlorophyll-a' ? 'Clorofila-a' : surface.variable;
  return (
    <View
      style={styles.legend}
      accessible
      accessibilityLabel={`${example ? 'Ejemplo sintético. ' : ''}${variable}: ${range[0].toFixed(1)} a ${range[1].toFixed(1)} ${surface.unit}`}
    >
      <Text style={styles.title}>
        {example ? 'EJEMPLO SINTÉTICO' : 'PREDICCIÓN ESPACIAL'}
      </Text>
      <Text style={styles.variable}>
        {variable} · {surface.unit}
      </Text>
      <View style={styles.bar}>
        {Array.from({ length: 24 }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor:
                range[0] === range[1]
                  ? surfaceColor(range[0], ...range)
                  : surfaceColor(i, 0, 23),
            }}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.value}>{range[0].toFixed(1)}</Text>
        <Text style={styles.value}>{range[1].toFixed(1)}</Text>
      </View>
      <Text style={styles.value}>Gris: sin predicción</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  legend: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 180,
    borderRadius: 12,
    padding: 12,
    gap: 5,
    backgroundColor: '#FFFFFFF2',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...tokens.shadow,
  },
  title: {
    color: tokens.colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  variable: { color: tokens.colors.heading, fontSize: 11, fontWeight: '700' },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 3,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { color: tokens.colors.muted, fontSize: 9 },
});
