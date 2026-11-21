import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppStateStatus } from 'react-native';

type RefreshClient = Pick<
  SupabaseClient['auth'],
  'startAutoRefresh' | 'stopAutoRefresh'
>;
type Lifecycle = {
  currentState: AppStateStatus;
  addEventListener: (
    event: 'change',
    listener: (state: AppStateStatus) => void,
  ) => { remove: () => void };
};

export function bindSessionLifecycle(
  auth: RefreshClient,
  lifecycle: Lifecycle,
) {
  let active = true;
  let queue = Promise.resolve();
  const sync = (state: AppStateStatus) => {
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
