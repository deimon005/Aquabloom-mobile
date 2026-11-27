export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export function resolveConnectivityStatus(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): ConnectivityStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }
  if (state.isConnected === true) return 'online';
  return 'unknown';
}
