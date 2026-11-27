import type { AppStateStatus } from 'react-native';
import { bindSessionLifecycle } from '../bindSessionLifecycle';

it('refreshes only in foreground and releases the listener and timer on unmount', async () => {
  let listener!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  const auth = {
    startAutoRefresh: jest.fn(async () => {}),
    stopAutoRefresh: jest.fn(async () => {}),
  };
  const dispose = bindSessionLifecycle(auth, {
    currentState: 'active',
    addEventListener: (_event, next) => {
      listener = next;
      return { remove };
    },
  });
  const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  await flush();
  expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
  listener('background');
  await flush();
  expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  listener('active');
  await flush();
  expect(auth.startAutoRefresh).toHaveBeenCalledTimes(2);
  dispose();
  await flush();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
});
