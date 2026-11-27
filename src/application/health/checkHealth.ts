export type HealthGateway = {
  check: (signal?: AbortSignal) => Promise<unknown>;
};
export function checkHealth(
  gateway: HealthGateway | null,
  signal?: AbortSignal,
) {
  if (!gateway) throw new Error('Configura EXPO_PUBLIC_API_URL.');
  return gateway.check(signal);
}
