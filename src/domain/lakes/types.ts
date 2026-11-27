import type { z } from 'zod';
import type {
  lakeSchema,
  lakeListSchema,
  lakeDetailSchema,
  stationSchema,
} from './catalogSchemas';
export type Lake = z.infer<typeof lakeSchema>;
export type LakeListResponse = z.infer<typeof lakeListSchema>;
export type LakeDetail = z.infer<typeof lakeDetailSchema>;
export type Station = z.infer<typeof stationSchema>;
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
