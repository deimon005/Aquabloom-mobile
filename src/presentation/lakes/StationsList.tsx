import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AsyncState } from '../shared/components/AsyncState';
import { tokens } from '../shared/theme/tokens';
import { catalogError } from './catalogError';
import { stationRoute } from './catalogNavigation';
import { useStations } from './useStations';
import { OfflineNotice } from '../offline/OfflineNotice';

export function StationsList({ lakeId }: { lakeId: string }) {
  const stations = useStations(lakeId);
  if (stations.isPending)
    return <AsyncState kind="loading" message="Cargando estaciones…" />;
  if (stations.isError)
    return (
      <AsyncState
        kind="error"
        message={catalogError(stations.error, 'las estaciones')}
        onRetry={() => void stations.refetch()}
      />
    );
  if (!stations.data?.length)
    return (
      <>
        {stations.isOffline ? (
          <OfflineNotice savedAt={stations.savedAt} />
        ) : null}
        <AsyncState
          kind="empty"
          message="Este lago no tiene estaciones registradas."
        />
      </>
    );
  return (
    <View style={styles.list}>
      {stations.isOffline ? <OfflineNotice savedAt={stations.savedAt} /> : null}
      {stations.data.map((station) => (
        <Pressable
          key={station.id}
          accessibilityRole="button"
          accessibilityLabel={'Ver estación ' + station.name}
          onPress={() => router.push(stationRoute(lakeId, station.id))}
          style={styles.card}
        >
          <Text style={styles.name}>{station.name}</Text>
          <Text>
            {station.code} · {station.status}
          </Text>
          <Text style={styles.action}>Ver estación →</Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  list: { gap: tokens.spacing.md },
  card: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    minHeight: 64,
  },
  name: { color: tokens.colors.text, fontSize: 18, fontWeight: '600' },
  action: { color: tokens.colors.primary },
});
