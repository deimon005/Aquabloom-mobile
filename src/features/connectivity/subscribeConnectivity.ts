import NetInfo from '@react-native-community/netinfo';
import {
  resolveConnectivityStatus,
  type ConnectivityStatus,
} from './connectivity';

export function subscribeConnectivity(
  listener: (status: ConnectivityStatus) => void,
) {
  return NetInfo.addEventListener((state) =>
    listener(resolveConnectivityStatus(state)),
  );
}
