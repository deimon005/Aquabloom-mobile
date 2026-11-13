import type { ConnectivityStatus } from './connectivity';

export function subscribeConnectivity(
  listener: (status: ConnectivityStatus) => void,
) {
  if (typeof window === 'undefined') return () => {};
  // Network Information change is not the same event as online/offline.
  const update = () => listener(window.navigator.onLine ? 'online' : 'offline');
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
