import type { LakeFilters, NormalizedLakeFilters } from './types';

export const defaultLakeFilters = {
  page: 1,
  page_size: 20,
} satisfies NormalizedLakeFilters;

function normalizedText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function positiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value ?? fallback));
}

export function normalizeLakeFilters(
  filters: LakeFilters = {},
): NormalizedLakeFilters {
  return {
    search: normalizedText(filters.search),
    region: normalizedText(filters.region),
    page: positiveInteger(filters.page, defaultLakeFilters.page),
    page_size: Math.min(
      100,
      positiveInteger(filters.page_size, defaultLakeFilters.page_size),
    ),
  };
}

export function serializeLakeFilters(filters: NormalizedLakeFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('text', filters.search);
  if (filters.region) params.set('region', filters.region);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.page_size));
  return params.toString();
}
