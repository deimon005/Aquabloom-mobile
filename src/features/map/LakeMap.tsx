import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import { lakeBounds } from './geometry';
import type { LakeMapProps } from './mapTypes';
import { AsyncState } from '../../components/AsyncState';
import { tokens } from '../../theme/tokens';

export function LakeMap({
  feature = null,
  stations,
  estimates,
  onSelect,
}: LakeMapProps) {
  const bounds = useMemo(
    () => (feature ? lakeBounds(feature) : undefined),
    [feature],
  );
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  return (
    <View style={styles.container}>
      <Map
        key={attempt}
        testID="lake-map"
        style={StyleSheet.absoluteFill}
        mapStyle="https://demotiles.maplibre.org/style.json"
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
                paint={{ 'fill-color': '#006879', 'fill-opacity': 0.3 }}
              />
              <Layer
                id="lake-outline"
                type="line"
                paint={{ 'line-color': '#006879', 'line-width': 2 }}
              />
            </GeoJSONSource>
          </>
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
              type="circle"
              paint={{
                'circle-radius': 7,
                'circle-color': '#D85A14',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF',
              }}
            />
          </GeoJSONSource>
        )}
        {estimates && (
          <GeoJSONSource id="estimates" data={estimates}>
            <Layer
              id="estimate-markers"
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
      </Map>
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
