import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../shared/theme/tokens';
import type { Lake } from '../../domain/lakes/types';
import { lakeRoute } from './catalogNavigation';
import { AppIcon } from '../shared/components/AppIcon';

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
        <View style={styles.lakeIcon}>
          <AppIcon name="lake" />
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{lake.name}</Text>
          <Text style={styles.location}>{location}</Text>
        </View>
        {lake.status ? (
          <Text
            accessibilityLabel={`Estado: ${lake.status}`}
            style={styles.status}
          >
            {lake.status}
          </Text>
        ) : null}
      </View>
      {lake.description ? (
        <Text numberOfLines={2} style={styles.description}>
          {lake.description}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.action}>Ver detalle</Text>
        <AppIcon name="arrow" size={18} />
      </View>
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
    ...tokens.shadow,
  },
  pressed: { opacity: 0.72 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  name: {
    color: tokens.colors.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  status: {
    color: tokens.colors.success,
    backgroundColor: tokens.colors.successSoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  location: { color: tokens.colors.muted, fontWeight: '600' },
  description: { color: tokens.colors.text, lineHeight: 20 },
  action: { color: tokens.colors.primary, fontWeight: '700' },
  lakeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: 4 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: 12,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
