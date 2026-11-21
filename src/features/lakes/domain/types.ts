export type Lake = {
  description?: string | null;
  /** Format: uuid */
  id: string;
  name: string;
  region: string;
  status: string;
};

export type LakeDetail = {
  /** Format: date-time */
  created_at: string;
  description?: string | null;
  geom: {
    [key: string]: unknown;
  };
  /** Format: uuid */
  id: string;
  name: string;
  region: string;
  status: string;
  /** Format: date-time */
  updated_at: string;
};

export type LakeListResponse = {
  items: Lake[];
  page: number;
  page_size: number;
  total: number;
};

export type Station = {
  code: string;
  /** Format: date-time */
  created_at: string;
  description?: string | null;
  /** Format: uuid */
  id: string;
  /** Format: uuid */
  lake_id: string;
  name: string;
  point: unknown;
  status: string;
  /** Format: date-time */
  updated_at: string;
};

// UI names; serialized to the backend's text/limit query parameters.
export type LakeFilters = {
  search?: string;
  region?: string;
  page?: number;
  page_size?: number;
};

export type NormalizedLakeFilters = {
  search?: string;
  region?: string;
  page: number;
  page_size: number;
};
