import NetInfo from '@react-native-community/netinfo';
import {
  resolveConnectivityStatus,
  type ConnectivityStatus,
} from '../../domain/connectivity/connectivity';
export const subscribeConnectivity = (
  listener: (status: ConnectivityStatus) => void,
) =>
  NetInfo.addEventListener((state) =>
    listener(resolveConnectivityStatus(state)),
  );
