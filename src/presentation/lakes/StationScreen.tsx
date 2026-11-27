import { Link } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '../shared/components/Screen';
import { AsyncState } from '../shared/components/AsyncState';
import { catalogError } from './catalogError';
import { lakeRoute } from './catalogNavigation';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import { useStations } from './useStations';
import { OfflineNotice } from '../offline/OfflineNotice';

export function StationScreen({
  lakeId,
  stationId,
}: {
  lakeId: string;
  stationId: string;
}) {
  const valid = isCatalogId(lakeId) && isCatalogId(stationId);
  const stations = useStations(valid ? lakeId : '');
  const station = stations.data?.find(
    (item) => item.id.toLowerCase() === stationId.toLowerCase(),
  );
  return (
    <Screen
      title={!stations.isError ? (station?.name ?? 'Estación') : 'Estación'}
    >
      {stations.isOffline && !stations.isError ? (
        <OfflineNotice savedAt={stations.savedAt} />
      ) : null}
      {!valid ? (
        <AsyncState
          kind="error"
          message="El enlace de la estación no es válido."
        />
      ) : stations.isPending ? (
        <AsyncState kind="loading" message="Cargando estación…" />
      ) : stations.isError ? (
        <AsyncState
          kind="error"
          message={catalogError(stations.error, 'la estación')}
          onRetry={() => void stations.refetch()}
        />
      ) : !station ? (
        <AsyncState
          kind="empty"
          message="La estación no pertenece a este lago o ya no está disponible."
        />
      ) : (
        <>
          <Text>Código: {station.code}</Text>
          <Text>Estado: {station.status}</Text>
          <Text>{station.description || 'Sin descripción disponible.'}</Text>
        </>
      )}
      {isCatalogId(lakeId) ? (
        <Link href={lakeRoute(lakeId)}>Volver al lago</Link>
      ) : (
        <Link href="/catalog">Volver al catálogo</Link>
      )}
    </Screen>
  );
}
