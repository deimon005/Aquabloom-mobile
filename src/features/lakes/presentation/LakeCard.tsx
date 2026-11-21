import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../../../theme/tokens';
import type { Lake } from '../domain/types';
import { lakeRoute } from '../application/catalogNavigation';

export function LakeCard({
  lake,
  style,
}: {
  lake: Lake;
  style?: StyleProp<ViewStyle>;
}) {
  const location = lake.region;
  const accessibleLocation = location ? `, ${location}` : '';

  return (
    <Pressable
      accessibilityHint="Abre la ficha completa del lago"
      accessibilityLabel={`Ver detalle de ${lake.name}${accessibleLocation}`}
      accessibilityRole="button"
      onPress={() => router.push(lakeRoute(lake.id))}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <View style={styles.headingRow}>
        <Text style={styles.name}>{lake.name}</Text>
        {lake.status ? (
          <Text
            accessibilityLabel={`Estado: ${lake.status}`}
            style={styles.status}
          >
            {lake.status}
          </Text>
        ) : null}
      </View>
      <Text style={styles.location}>{location}</Text>
      {lake.description ? (
        <Text numberOfLines={2} style={styles.description}>
          {lake.description}
        </Text>
      ) : null}
      <Text accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.action}>Ver detalle →</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
  },
  pressed: { opacity: 0.72 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  name: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  status: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  location: { color: tokens.colors.muted, fontWeight: '600' },
  description: { color: tokens.colors.text, lineHeight: 20 },
  action: { color: tokens.colors.primary, fontWeight: '700' },
});
