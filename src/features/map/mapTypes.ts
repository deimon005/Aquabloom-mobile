import type { LakeFeature, StationFeatures } from './geometry';
export type MapSelection = { kind: 'lake' | 'station'; id: string };
export type LakeMapProps = {
  feature?: LakeFeature | null;
  stations?: StationFeatures;
  observationLocation?: { latitude: number; longitude: number } | null;
  onSelect?: (selection: MapSelection) => void;
};
