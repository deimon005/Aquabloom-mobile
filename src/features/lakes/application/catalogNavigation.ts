export const lakeRoute = (id: string) => ({
  pathname: '/lakes/[id]' as const,
  params: { id },
});
export const stationRoute = (id: string, stationId: string) => ({
  pathname: '/lakes/[id]/stations/[stationId]' as const,
  params: { id, stationId },
});
