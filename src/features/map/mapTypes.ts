import type { EstimateFeatures, LakeFeature, StationFeatures } from './geometry';
export type MapSelection = { kind: 'lake' | 'station'; id: string };
export type LakeMapProps = {
  feature?: LakeFeature | null;
  stations?: StationFeatures;
  estimates?: EstimateFeatures;
  onSelect?: (selection: MapSelection) => void;
};
