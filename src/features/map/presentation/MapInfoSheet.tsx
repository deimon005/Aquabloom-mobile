import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { LakeDetail, Station } from '../../lakes/domain/types';
import {
  lakeRoute,
  stationRoute,
} from '../../lakes/application/catalogNavigation';
import { tokens } from '../../../theme/tokens';

export function MapInfoSheet({
  lake,
  station,
  onClose,
}: {
  lake: LakeDetail;
  station?: Station;
  onClose: () => void;
}) {
  const item = station ?? lake;
  return (
    <View style={styles.sheet}>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Text accessibilityRole="header" style={styles.title}>
          {item.name}
        </Text>
        <Text>
          {station ? `Estación ${station.code} · ${lake.name}` : lake.region}
        </Text>
        <Text>Estado: {item.status}</Text>
        <Text>{item.description || 'Sin descripción disponible.'}</Text>
        <Link
          href={
            station ? stationRoute(lake.id, station.id) : lakeRoute(lake.id)
          }
          accessibilityLabel={`Ver detalle de ${item.name}`}
          style={styles.link}
        >
          Ver detalle
        </Link>
        <Button title="Cerrar ficha" onPress={onClose} />
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
  link: { color: tokens.colors.primary, paddingVertical: 12 },
});
