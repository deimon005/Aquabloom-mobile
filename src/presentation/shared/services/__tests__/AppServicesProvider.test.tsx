import {
  render as renderNative,
  screen,
  fireEvent,
} from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import type { AppServices } from '../../../../application/shared/AppServices';
import { AppServicesProvider, useAppServices } from '../AppServicesProvider';

function services(apiUrl: string): AppServices {
  return {
    config: { apiUrl, environmentValid: true, scientificApiEnabled: false },
    auth: {
      client: null,
      sessionRefresh: null,
      signInWithPassword: jest.fn(),
      signUpWithPassword: jest.fn(),
      signOutAndClearCache: jest.fn(),
      setCatalogIdentity: jest.fn(),
    },
    catalogQueries: { list: jest.fn(), detail: jest.fn(), stations: jest.fn() },
    scientificQueries: { estimates: jest.fn(), job: jest.fn() },
    observations: {
      captureServices: {
        cameraPermission: jest.fn(),
        takePhoto: jest.fn(),
        captureLocation: jest.fn(),
      },
      observationStore: {
        durability: 'session',
        save: jest.fn(),
        list: jest.fn(),
        latest: jest.fn(),
        remove: jest.fn(),
      },
      photoPersistence: {
        prepare: jest.fn(),
        removeCreated: jest.fn(),
        removeDraft: jest.fn(),
      },
    },
    health: { configured: true, loadHealth: jest.fn(async () => ({})) },
    subscribeConnectivity: jest.fn(),
  };
}

function Probe({ name }: { name: string }) {
  const injected = useAppServices();
  return (
    <View>
      <Text>
        {name}: {injected.config.apiUrl}
      </Text>
      <Button title={name} onPress={() => void injected.health.loadHealth()} />
    </View>
  );
}

it('keeps two injected service sets isolated and uses replacements on rerender', async () => {
  const first = services('api-first');
  const second = services('api-second');
  const replacement = services('api-replacement');
  const tree = (left: AppServices) => (
    <View>
      <AppServicesProvider services={left}>
        <Probe name="First" />
      </AppServicesProvider>
      <AppServicesProvider services={second}>
        <Probe name="Second" />
      </AppServicesProvider>
    </View>
  );
  const view = await renderNative(tree(first));
  expect(screen.getByText('First: api-first')).toBeTruthy();
  expect(screen.getByText('Second: api-second')).toBeTruthy();
  await fireEvent.press(screen.getByText('First'));
  expect(first.health.loadHealth).toHaveBeenCalledTimes(1);
  expect(second.health.loadHealth).not.toHaveBeenCalled();

  await view.rerender(tree(replacement));
  expect(screen.getByText('First: api-replacement')).toBeTruthy();
  await fireEvent.press(screen.getByText('First'));
  expect(replacement.health.loadHealth).toHaveBeenCalledTimes(1);
  expect(first.health.loadHealth).toHaveBeenCalledTimes(1);
});

it('reports missing injection instead of resolving concrete services globally', async () => {
  await expect(renderNative(<Probe name="Unconfigured" />)).rejects.toThrow(
    'useAppServices requiere AppServicesProvider.',
  );
});
