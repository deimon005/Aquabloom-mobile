import type { NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export function resolveConnectivityStatus(
  state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>,
): ConnectivityStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }
  if (state.isConnected === true) return 'online';
  return 'unknown';
}
