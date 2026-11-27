import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import { lakeBounds } from '../../domain/map/geometry';
import type { LakeMapProps } from './mapTypes';
import { AsyncState } from '../shared/components/AsyncState';
import { tokens } from '../shared/theme/tokens';
import { lakeExteriorMask, surfaceFill } from '../../domain/map/spatialData';
import { PredictionLegend } from './PredictionLegend';

export function LakeMap({
  feature = null,
  stations,
  estimates,
  surface,
  measurements = [],
  example = false,
  observationLocation,
  onSelect,
}: LakeMapProps) {
  const displayedSurface =
    feature &&
    surface?.lake_id.toLowerCase() === feature.properties.id.toLowerCase()
      ? surface
      : null;
  const mask = useMemo(
    () =>
      displayedSurface && feature
        ? lakeExteriorMask(feature, displayedSurface)
        : null,
    [displayedSurface, feature],
  );
  const measuredPoints = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: measurements
        .filter(
          (item) =>
            item.lake_id.toLowerCase() === feature?.properties.id.toLowerCase(),
        )
        .map((item) => ({
          type: 'Feature' as const,
          properties: { id: item.id },
          geometry: {
            type: 'Point' as const,
            coordinates: [item.longitude, item.latitude],
          },
        })),
    }),
    [measurements, feature],
  );
  const bounds = useMemo(() => {
    if (!feature) return undefined;
    const [west, south, east, north] = lakeBounds(feature);
    if (!observationLocation)
      return [west, south, east, north] as [number, number, number, number];
    return [
      Math.min(west, observationLocation.longitude),
      Math.min(south, observationLocation.latitude),
      Math.max(east, observationLocation.longitude),
      Math.max(north, observationLocation.latitude),
    ] as [number, number, number, number];
  }, [feature, observationLocation]);
  const capturedPoint = useMemo(
    () =>
      observationLocation
        ? {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Point' as const,
              coordinates: [
                observationLocation.longitude,
                observationLocation.latitude,
              ],
            },
          }
        : null,
    [observationLocation],
  );
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  return (
    <View style={styles.container}>
      <Map
        key={`${attempt}-${displayedSurface ? 'analysis' : 'base'}`}
        testID="lake-map"
        style={StyleSheet.absoluteFill}
        mapStyle={
          displayedSurface
            ? JSON.stringify({
                version: 8,
                sources: {},
                layers: [
                  {
                    id: 'analysis-background',
                    type: 'background',
                    paint: { 'background-color': '#EAF1EF' },
                  },
                ],
              })
            : 'https://demotiles.maplibre.org/style.json'
        }
        onDidFinishLoadingMap={() => setStatus('ready')}
        onDidFailLoadingMap={() => setStatus('error')}
      >
        <Camera
          initialViewState={{ center: [-72.15, -39.28], zoom: 7 }}
          bounds={bounds}
          padding={{ top: 40, bottom: 40, left: 40, right: 40 }}
          duration={500}
        />
        {feature && (
          <>
            <GeoJSONSource
              id="selected-lake"
              data={feature}
              onPress={(event) => {
                event.stopPropagation();
                onSelect?.({ kind: 'lake', id: feature.properties.id });
              }}
            >
              <Layer
                id="lake-fill"
                type="fill"
                paint={{
                  'fill-color': displayedSurface ? '#DEE7E7' : '#A9D4DC',
                  'fill-opacity': 1,
                }}
              />
            </GeoJSONSource>
          </>
        )}
        {displayedSurface && (
          <GeoJSONSource
            id="prediction-surface"
            data={displayedSurface.cells}
            onPress={(event) => {
              event.stopPropagation();
              const id = event.nativeEvent.features[0]?.properties?.id;
              if (
                typeof id === 'string' &&
                displayedSurface.cells.features.some(
                  (cell) => cell.properties.id === id,
                )
              )
                onSelect?.({ kind: 'prediction-cell', id });
            }}
          >
            <Layer
              id="prediction-colors"
              afterId="lake-fill"
              type="fill"
              paint={{
                'fill-color': surfaceFill(displayedSurface),
                'fill-opacity': 1,
                'fill-antialias': false,
              }}
            />
          </GeoJSONSource>
        )}
        {mask && (
          <GeoJSONSource id="prediction-shore-mask" data={mask}>
            <Layer
              id="prediction-mask"
              afterId="prediction-colors"
              type="fill"
              paint={{ 'fill-color': '#EAF1EF', 'fill-opacity': 1 }}
            />
          </GeoJSONSource>
        )}
        {feature && (
          <GeoJSONSource id="lake-boundary" data={feature}>
            <Layer
              id="lake-outline-white"
              afterId={displayedSurface ? 'prediction-mask' : 'lake-fill'}
              type="line"
              paint={{ 'line-color': '#FFFFFF', 'line-width': 5 }}
            />
            <Layer
              id="lake-outline"
              afterId="lake-outline-white"
              type="line"
              paint={{ 'line-color': '#7FAAB7', 'line-width': 1.5 }}
            />
          </GeoJSONSource>
        )}
        {stations && (
          <GeoJSONSource
            id="stations"
            data={stations}
            onPress={(event) => {
              event.stopPropagation();
              const id = event.nativeEvent.features[0]?.properties?.id;
              if (
                typeof id === 'string' &&
                stations.features.some((item) => item.properties.id === id)
              )
                onSelect?.({ kind: 'station', id });
            }}
          >
            <Layer
              id="station-markers"
              afterId={feature ? 'lake-outline' : undefined}
              type="circle"
              paint={{
                'circle-radius': 7,
                'circle-color': '#FFFFFF',
                'circle-stroke-width': 3,
                'circle-stroke-color': tokens.colors.primary,
              }}
            />
          </GeoJSONSource>
        )}
        {estimates && (
          <GeoJSONSource
            id="estimates"
            data={estimates}
            onPress={(event) => {
              event.stopPropagation();
              const id = event.nativeEvent.features[0]?.properties?.id;
              if (
                typeof id === 'string' &&
                estimates.features.some((item) => item.properties.id === id)
              )
                onSelect?.({ kind: 'estimate', id });
            }}
          >
            <Layer
              id="estimate-markers"
              afterId={
                stations
                  ? 'station-markers'
                  : feature
                    ? 'lake-outline'
                    : undefined
              }
              type="circle"
              paint={{
                'circle-radius': 8,
                'circle-color': '#6A42B8',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </GeoJSONSource>
        )}
        {!!measuredPoints.features.length && (
          <GeoJSONSource
            id="measurements"
            data={measuredPoints}
            onPress={(event) => {
              event.stopPropagation();
              const id = event.nativeEvent.features[0]?.properties?.id;
              if (
                typeof id === 'string' &&
                measuredPoints.features.some(
                  (point) => point.properties.id === id,
                )
              )
                onSelect?.({ kind: 'measurement', id });
            }}
          >
            <Layer
              id="measurement-markers"
              afterId={
                estimates
                  ? 'estimate-markers'
                  : stations
                    ? 'station-markers'
                    : 'lake-outline'
              }
              type="circle"
              paint={{
                'circle-radius': 7,
                'circle-color': '#FFFFFF',
                'circle-stroke-color': '#087984',
                'circle-stroke-width': 3,
              }}
            />
          </GeoJSONSource>
        )}
        {capturedPoint && (
          <GeoJSONSource id="captured-location" data={capturedPoint}>
            <Layer
              id="captured-location-marker"
              afterId={
                measuredPoints.features.length
                  ? 'measurement-markers'
                  : estimates
                    ? 'estimate-markers'
                    : stations
                      ? 'station-markers'
                      : feature
                        ? 'lake-outline'
                        : undefined
              }
              type="circle"
              paint={{
                'circle-radius': 9,
                'circle-color': '#2656C7',
                'circle-stroke-width': 3,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </GeoJSONSource>
        )}
      </Map>
      {displayedSurface && (
        <PredictionLegend surface={displayedSurface} example={example} />
      )}
      {status !== 'ready' && (
        <View style={styles.notice}>
          <AsyncState
            kind={status}
            message={
              status === 'loading'
                ? 'Cargando mapa…'
                : 'No se pudo cargar el mapa. Comprueba tu conexión.'
            }
            onRetry={() => {
              setStatus('loading');
              setAttempt((value) => value + 1);
            }}
          />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  notice: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
  },
});
