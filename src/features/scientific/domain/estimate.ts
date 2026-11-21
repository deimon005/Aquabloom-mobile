export type EstimatePoint = {
  dataset_id?: string | null;
  dataset_version?: string | null;
  /** Format: uuid */
  id: string;
  /** Format: uuid */
  lake_id: string;
  latitude?: number | null;
  longitude?: number | null;
  model_id?: string | null;
  model_version?: string | null;
  /** Format: date-time */
  observed_at: string;
  point_id: string;
  scene_id?: string | null;
  status: string;
  unit: string;
  value: number;
  variable: string;
  warnings: string[];
};

export type EstimateListResponse = { items: EstimatePoint[] };
