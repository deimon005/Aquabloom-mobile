import type {
  EstimateFeatures,
  LakeFeature,
  StationFeatures,
} from './geometry';
export type MapSelection = {
  kind: 'lake' | 'station' | 'estimate';
  id: string;
};
export type LakeMapProps = {
  feature?: LakeFeature | null;
  stations?: StationFeatures;
  estimates?: EstimateFeatures;
  observationLocation?: { latitude: number; longitude: number } | null;
  onSelect?: (selection: MapSelection) => void;
};
