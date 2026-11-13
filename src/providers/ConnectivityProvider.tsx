import { onlineManager } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { ConnectivityStatus } from '../features/connectivity/connectivity';
import { subscribeConnectivity } from '../features/connectivity/subscribeConnectivity';

const ConnectivityContext = createContext<ConnectivityStatus>('unknown');

export function ConnectivityProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<ConnectivityStatus>('unknown');

  useEffect(
    () =>
      subscribeConnectivity((nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus !== 'unknown') {
          onlineManager.setOnline(nextStatus === 'online');
        }
      }),
    [],
  );

  return (
    <ConnectivityContext.Provider value={status}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
