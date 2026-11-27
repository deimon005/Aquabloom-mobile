import type {
  EstimateFeatures,
  LakeFeature,
  StationFeatures,
} from '../../domain/map/geometry';
import type {
  Measurement,
  PredictionSurface,
} from '../../domain/map/spatialData';
export type MapSelection = {
  kind: 'lake' | 'station' | 'estimate' | 'measurement' | 'prediction-cell';
  id: string;
};
export type LakeMapProps = {
  feature?: LakeFeature | null;
  stations?: StationFeatures;
  estimates?: EstimateFeatures;
  surface?: PredictionSurface | null;
  measurements?: Measurement[];
  example?: boolean;
  observationLocation?: { latitude: number; longitude: number } | null;
  onSelect?: (selection: MapSelection) => void;
};
