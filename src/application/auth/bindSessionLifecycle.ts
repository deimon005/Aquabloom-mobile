import type { SessionRefresh } from '../../domain/auth/auth';

type Lifecycle = {
  currentState: string;
  addEventListener: (
    event: 'change',
    listener: (state: string) => void,
  ) => { remove: () => void };
};

export function bindSessionLifecycle(
  auth: SessionRefresh,
  lifecycle: Lifecycle,
) {
  let active = true;
  let queue = Promise.resolve();
  const sync = (state: string) => {
    // Serialize transitions, including a quick background/unmount transition.
    queue = queue
      .then(() =>
        active && state === 'active'
          ? auth.startAutoRefresh()
          : auth.stopAutoRefresh(),
      )
      .catch(() => undefined);
  };
  sync(lifecycle.currentState);
  const subscription = lifecycle.addEventListener('change', sync);
  return () => {
    active = false;
    subscription.remove();
    sync('background');
  };
}
