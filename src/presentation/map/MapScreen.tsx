import { ActionButton as Button } from '../shared/components/ActionButton';
import { useAppServices } from '../shared/services/AppServicesProvider';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AsyncState } from '../shared/components/AsyncState';
import { useLakes } from '../lakes/useLakes';
import { useLakeDetail } from '../lakes/useLakeDetail';
import { useStations } from '../lakes/useStations';
import { useEstimates } from '../scientific/useScientific';
import { scientificSource } from '../../domain/scientific/source';
import { OfflineNotice } from '../offline/OfflineNotice';
import { catalogError } from '../lakes/catalogError';
import { LakeMap } from './LakeMap';
import {
  estimateFeatures,
  lakeFeature,
  stationFeatures,
} from '../../domain/map/geometry';
import type { MapSelection } from './mapTypes';
import { MapInfoSheet } from './MapInfoSheet';
import { EstimateInfoSheet } from './EstimateInfoSheet';
import { tokens } from '../shared/theme/tokens';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import { lakeVisualizationExample } from '../../domain/map/spatialData';

export function MapScreen() {
  const params = useLocalSearchParams<{ lakeId?: string | string[] }>();
  const requestedLake =
    typeof params.lakeId === 'string' && isCatalogId(params.lakeId)
      ? params.lakeId
      : '';
  return <MapScreenContent key={requestedLake} requestedLake={requestedLake} />;
}

function MapScreenContent({ requestedLake }: { requestedLake: string }) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(requestedLake);
  const [exampleLakeId, setExampleLakeId] = useState<string | null>(null);
  const [showSurface, setShowSurface] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const lakes = useLakes({ page, page_size: 20 });
  const detail = useLakeDetail(selectedId);
  const stations = useStations(selectedId);
  const { config } = useAppServices();
  const source = scientificSource(undefined, config.scientificApiEnabled);
  const estimates = useEstimates(selectedId, source);
  const markers = useMemo(
    () =>
      stationFeatures(
        stations.isError ? [] : (stations.data ?? []),
        selectedId,
      ),
    [stations.data, stations.isError, selectedId],
  );
  const feature = useMemo(
    () => (detail.data && !detail.isError ? lakeFeature(detail.data) : null),
    [detail.data, detail.isError],
  );
  const remoteSurface =
    !estimates.isError &&
    estimates.data?.surface?.lake_id.toLowerCase() === selectedId.toLowerCase()
      ? estimates.data.surface
      : null;
  const exampleActive = Boolean(
    feature &&
    exampleLakeId === selectedId &&
    !remoteSurface &&
    !estimates.data?.measurements?.length,
  );
  const exampleData = useMemo(
    () => (feature && exampleActive ? lakeVisualizationExample(feature) : null),
    [feature, exampleActive],
  );
  const surface = remoteSurface ?? exampleData?.surface ?? null;
  const measurements =
    exampleData?.measurements ??
    (!estimates.isError ? (estimates.data?.measurements ?? []) : []);
  const selectedMeasurement =
    showMeasurements && selection?.kind === 'measurement'
      ? measurements.find((point) => point.id === selection.id)
      : undefined;
  const selectedCell =
    showSurface && selection?.kind === 'prediction-cell'
      ? surface?.cells.features.find(
          (cell) => cell.properties.id === selection.id,
        )
      : undefined;
  const estimateMarkers = useMemo(
    () =>
      estimateFeatures(
        estimates.isError ? [] : (estimates.data?.items ?? []),
        selectedId,
      ),
    [estimates.data, estimates.isError, selectedId],
  );
  const selectedStation =
    selection?.kind === 'station' && !stations.isError
      ? stations.data?.find(
          (station) =>
            station.id === selection.id && station.lake_id === selectedId,
        )
      : undefined;
  const selectedEstimate =
    selection?.kind === 'estimate' &&
    !estimates.isError &&
    estimateMarkers.features.some((item) => item.properties.id === selection.id)
      ? estimates.data?.items.find(
          (estimate) =>
            estimate.id === selection.id && estimate.lake_id === selectedId,
        )
      : undefined;
  const showSheet =
    detail.data &&
    !detail.isError &&
    selection &&
    (selectedStation ||
      (selection.kind === 'lake' && selection.id === selectedId));
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: tokens.colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        style={{ maxHeight: '40%', flexGrow: 0 }}
        contentContainerStyle={{
          padding: 20,
          gap: 12,
          backgroundColor: tokens.colors.surface,
        }}
      >
        {lakes.isPending ? (
          <AsyncState kind="loading" message="Cargando lagos…" />
        ) : lakes.isError ? (
          <AsyncState
            kind="error"
            message={catalogError(lakes.error, 'los lagos del mapa')}
            onRetry={() => lakes.refetch()}
          />
        ) : (
          <>
            <Text style={{ color: tokens.colors.heading, fontWeight: '700' }}>
              Explora las mediciones y predicciones del lago
            </Text>
            <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
              {lakes.data?.items.map((lake) => (
                <Button
                  key={lake.id}
                  title={lake.name}
                  accessibilityLabel={`Mostrar ${lake.name} en el mapa`}
                  onPress={() => {
                    setSelectedId(lake.id);
                    setSelection({ kind: 'lake', id: lake.id });
                  }}
                />
              ))}
            </ScrollView>
            {lakes.data?.total === 0 && <Text>No hay lagos disponibles.</Text>}
            {(page > 1 || (lakes.data?.total ?? 0) > 20) && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Button
                  title="Anterior"
                  disabled={page === 1 || lakes.isFetching}
                  onPress={() => setPage(page - 1)}
                />
                <Text>Página {page}</Text>
                <Button
                  title="Siguiente"
                  disabled={
                    lakes.isFetching || page * 20 >= (lakes.data?.total ?? 0)
                  }
                  onPress={() => setPage(page + 1)}
                />
              </View>
            )}
          </>
        )}
        {lakes.isOffline && !lakes.isError && (
          <OfflineNotice savedAt={lakes.savedAt} />
        )}
        {!!selectedId &&
          (detail.isPending ? (
            <AsyncState kind="loading" message="Cargando polígono…" />
          ) : detail.isError ? (
            <AsyncState
              kind="error"
              message={catalogError(detail.error, 'el polígono')}
              onRetry={() => detail.refetch()}
            />
          ) : !feature ? (
            <Text>Este lago no tiene un polígono válido disponible.</Text>
          ) : (
            <Text>{feature.properties.name}</Text>
          ))}
        {detail.isOffline && !detail.isError && (
          <OfflineNotice savedAt={detail.savedAt} />
        )}
        {!!selectedId &&
          (stations.isPending ? (
            <AsyncState kind="loading" message="Cargando estaciones…" />
          ) : stations.isError ? (
            <AsyncState
              kind="error"
              message={catalogError(stations.error, 'las estaciones')}
              onRetry={() => stations.refetch()}
            />
          ) : (
            <>
              <Text>
                {markers.features.length} estaciones con ubicación disponible
              </Text>
              {(stations.data?.length ?? 0) > markers.features.length && (
                <Text>
                  Hay estaciones sin coordenadas válidas que no se muestran en
                  el mapa.
                </Text>
              )}
              {stations.isOffline && (
                <OfflineNotice savedAt={stations.savedAt} />
              )}
            </>
          ))}
        {!!selectedId &&
          (source === 'disabled' ? null : estimates.isPending ? (
            <AsyncState kind="loading" message="Cargando estimaciones…" />
          ) : estimates.isError ? (
            <AsyncState
              kind="error"
              message="No pudimos consultar las estimaciones de este lago."
              onRetry={() => estimates.refetch()}
            />
          ) : !estimates.data?.items.length &&
            (surface || measurements.length) ? null : !estimates.data?.items
              .length ? (
            <AsyncState
              kind="empty"
              message="No hay estimaciones para este lago."
            />
          ) : !estimateMarkers.features.length ? (
            <AsyncState
              kind="empty"
              message="Las estimaciones no tienen coordenadas para mostrar en el mapa."
            />
          ) : (
            <Text>
              {estimateMarkers.features.length} estimaciones con coordenadas
              válidas
            </Text>
          ))}
        {source === 'proposal' &&
          !estimates.isError &&
          estimates.savedAt !== undefined && (
            <OfflineNotice savedAt={estimates.savedAt} />
          )}
      </ScrollView>
      {!!selectedId && (
        <ScrollView
          horizontal
          style={{ flexGrow: 0, maxHeight: 52 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
        >
          {markers.features.map((marker) => (
            <Button
              key={marker.properties.id}
              title={marker.properties.name}
              accessibilityLabel={`Seleccionar estación ${marker.properties.name}`}
              onPress={() =>
                setSelection({ kind: 'station', id: marker.properties.id })
              }
            />
          ))}
        </ScrollView>
      )}
      {feature && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 10,
            backgroundColor: tokens.colors.surface,
            borderTopWidth: 1,
            borderColor: tokens.colors.border,
          }}
        >
          {exampleActive ? (
            <Text
              accessibilityRole="alert"
              style={{
                color: tokens.colors.primary,
                fontWeight: '700',
                fontSize: 11,
              }}
            >
              EJEMPLO VISUAL · Datos sintéticos, sin resultados ambientales
              reales.
            </Text>
          ) : surface ? (
            <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>
              Fecha: {surface.observed_at} · Modelo: {surface.model_version}
            </Text>
          ) : (
            <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>
              Aún no hay una superficie de predicción disponible para este lago.
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {surface && (
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Mostrar predicciones"
                accessibilityState={{ checked: showSurface }}
                onPress={() => {
                  setShowSurface((value) => !value);
                  setSelection(null);
                }}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                  backgroundColor: showSurface
                    ? tokens.colors.primarySoft
                    : tokens.colors.background,
                }}
              >
                <Text
                  style={{
                    color: tokens.colors.primary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  Predicciones
                </Text>
              </Pressable>
            )}
            {!!measurements.length && (
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Mostrar mediciones"
                accessibilityState={{ checked: showMeasurements }}
                onPress={() => {
                  setShowMeasurements((value) => !value);
                  setSelection(null);
                }}
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                  backgroundColor: showMeasurements
                    ? tokens.colors.primarySoft
                    : tokens.colors.background,
                }}
              >
                <Text
                  style={{
                    color: tokens.colors.primary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  Mediciones · {measurements.length}
                </Text>
              </Pressable>
            )}
          </View>
          {!remoteSurface && !estimates.data?.measurements?.length && (
            <Button
              title={
                exampleActive
                  ? 'Cerrar ejemplo visual'
                  : 'Ver ejemplo de visualización'
              }
              onPress={() => {
                setExampleLakeId(exampleActive ? null : selectedId);
                setSelection(null);
                setShowSurface(true);
                setShowMeasurements(true);
              }}
            />
          )}
        </View>
      )}
      <LakeMap
        feature={feature}
        stations={markers}
        estimates={estimateMarkers}
        surface={showSurface ? surface : null}
        measurements={showMeasurements ? measurements : []}
        example={exampleActive}
        onSelect={setSelection}
      />
      {showSheet && detail.data && (
        <MapInfoSheet
          lake={detail.data}
          station={selectedStation}
          onClose={() => setSelection(null)}
        />
      )}
      {selectedEstimate && (
        <EstimateInfoSheet
          estimate={selectedEstimate}
          onClose={() => setSelection(null)}
        />
      )}
      {(selectedMeasurement || selectedCell) && (
        <View
          style={{
            maxHeight: '30%',
            padding: 18,
            backgroundColor: tokens.colors.surface,
            borderTopWidth: 1,
            borderColor: tokens.colors.border,
          }}
        >
          <ScrollView contentContainerStyle={{ gap: 8 }}>
            <Text
              style={{
                color: tokens.colors.heading,
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              {selectedMeasurement
                ? 'Medición observada'
                : 'Predicción espacial'}
            </Text>
            {exampleActive && (
              <Text accessibilityRole="alert">
                Datos sintéticos de ejemplo.
              </Text>
            )}
            <Text>
              Valor:{' '}
              {selectedMeasurement?.value ?? selectedCell?.properties.value}{' '}
              {selectedMeasurement?.unit ?? surface?.unit}
            </Text>
            <Text>
              Fecha: {selectedMeasurement?.measured_at ?? surface?.observed_at}
            </Text>
            {selectedCell && <Text>Modelo: {surface?.model_version}</Text>}
            <Button
              title="Cerrar resultado"
              onPress={() => setSelection(null)}
            />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}
