import { useId, useMemo, type KeyboardEvent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Position, Polygon, MultiPolygon } from 'geojson';
import { lakeBounds } from '../../domain/map/geometry';
import { surfaceColor, surfaceRange } from '../../domain/map/spatialData';
import type { LakeMapProps, MapSelection } from './mapTypes';
import { PredictionLegend } from './PredictionLegend';
import { tokens } from '../shared/theme/tokens';

export function LakeMap({
  feature,
  surface,
  measurements = [],
  stations,
  estimates,
  onSelect,
  example,
}: LakeMapProps) {
  const clipId = 'lake-' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const projection = useMemo(() => {
    if (!feature) return null;
    const [west, south, east, north] = lakeBounds(feature);
    const latitudeScale = Math.cos((((south + north) / 2) * Math.PI) / 180);
    const width = (east - west) * latitudeScale,
      height = north - south;
    const scale = Math.min(
      900 / Math.max(width, 1e-9),
      480 / Math.max(height, 1e-9),
    );
    return ([longitude, latitude]: Position) => [
      (longitude - west) * latitudeScale * scale + (1000 - width * scale) / 2,
      (north - latitude) * scale + (600 - height * scale) / 2,
    ];
  }, [feature]);
  const path = (geometry: Polygon | MultiPolygon) => {
    const polygons =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.coordinates;
    return polygons
      .flatMap((polygon) =>
        polygon.map(
          (ring) =>
            ring
              .map(
                (point, i) => `${i ? 'L' : 'M'}${projection!(point).join(',')}`,
              )
              .join(' ') + 'Z',
        ),
      )
      .join(' ');
  };
  const displayedSurface =
    feature &&
    surface?.lake_id.toLowerCase() === feature.properties.id.toLowerCase()
      ? surface
      : null;
  const range = surfaceRange(displayedSurface);
  const select = (selection: MapSelection) => ({
    onClick: () => onSelect?.(selection),
    onKeyDown: (event: KeyboardEvent<SVGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.(selection);
      }
    },
  });
  if (!feature || !projection)
    return (
      <View style={styles.empty}>
        <Text style={styles.hint}>
          Selecciona un lago para explorar su contorno, mediciones y
          predicciones.
        </Text>
      </View>
    );
  return (
    <View style={styles.map}>
      <svg
        viewBox="0 0 1000 600"
        width="100%"
        height="100%"
        aria-label={`Mapa analítico de ${feature.properties.name}`}
        role="group"
        style={{ minHeight: 300, display: 'block' }}
      >
        <defs>
          <pattern
            id={clipId + '-grid'}
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M64 0H0V64"
              fill="none"
              stroke="#C8DAD9"
              strokeOpacity=".55"
            />
          </pattern>
          <clipPath id={clipId}>
            <path d={path(feature.geometry)} clipRule="evenodd" />
          </clipPath>
        </defs>
        <rect width="1000" height="600" fill="#EAF1EF" />
        <rect width="1000" height="600" fill={`url(#${clipId}-grid)`} />
        <path
          d={path(feature.geometry)}
          fill={displayedSurface ? '#DEE7E7' : '#A9D4DC'}
          fillRule="evenodd"
          {...select({ kind: 'lake', id: feature.properties.id })}
        />
        {displayedSurface && range && (
          <g clipPath={`url(#${clipId})`}>
            {displayedSurface.cells.features.map((cell) => (
              <path
                key={cell.properties.id}
                d={path(cell.geometry)}
                fill={surfaceColor(cell.properties.value, ...range)}
                fillRule="evenodd"
                stroke="none"
                role="button"
                tabIndex={0}
                aria-label={`Predicción: ${cell.properties.value.toFixed(1)} ${displayedSurface.unit}`}
                {...select({ kind: 'prediction-cell', id: cell.properties.id })}
              />
            ))}
          </g>
        )}
        <path
          d={path(feature.geometry)}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
        />
        <path
          d={path(feature.geometry)}
          fill="none"
          stroke="#80AAB7"
          strokeWidth="2"
        />
        {stations?.features.map((station) => {
          const [cx, cy] = projection(station.geometry.coordinates);
          return (
            <circle
              key={station.properties.id}
              cx={cx}
              cy={cy}
              r="8"
              fill="white"
              stroke="#087984"
              strokeWidth="4"
              role="button"
              tabIndex={0}
              aria-label={station.properties.name}
              {...select({ kind: 'station', id: station.properties.id })}
            />
          );
        })}
        {measurements
          .filter(
            (m) =>
              m.lake_id.toLowerCase() === feature.properties.id.toLowerCase(),
          )
          .map((measurement) => {
            const [cx, cy] = projection([
              measurement.longitude,
              measurement.latitude,
            ]);
            return (
              <circle
                key={measurement.id}
                cx={cx}
                cy={cy}
                r="8"
                fill="white"
                stroke="#087984"
                strokeWidth="4"
                role="button"
                tabIndex={0}
                aria-label={`${measurement.name ?? 'Medición'}: ${measurement.value} ${measurement.unit}`}
                {...select({ kind: 'measurement', id: measurement.id })}
              />
            );
          })}
        {estimates?.features.map((estimate) => {
          const [cx, cy] = projection(estimate.geometry.coordinates);
          return (
            <circle
              key={estimate.properties.id}
              cx={cx}
              cy={cy}
              r="7"
              fill="#6A42B8"
              stroke="white"
              strokeWidth="3"
              role="button"
              tabIndex={0}
              aria-label={`Predicción por punto ${estimate.properties.pointId}`}
              {...select({ kind: 'estimate', id: estimate.properties.id })}
            />
          );
        })}
      </svg>
      {displayedSurface && (
        <PredictionLegend surface={displayedSurface} example={example} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#EAF1EF',
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    minHeight: 280,
    backgroundColor: '#EAF1EF',
    padding: 24,
    justifyContent: 'center',
  },
  hint: { color: tokens.colors.muted, textAlign: 'center', lineHeight: 22 },
});
