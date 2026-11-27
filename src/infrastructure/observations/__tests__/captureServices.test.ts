import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { captureServices } from '../captureServices';

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));
const permission = { granted: true, canAskAgain: true };
const position = {
  coords: { latitude: -39.6, longitude: -72.3, accuracy: 8 },
  timestamp: Date.parse('2026-10-14T12:00:00Z'),
};
beforeEach(() => {
  jest
    .mocked(Location.getForegroundPermissionsAsync)
    .mockResolvedValue(permission as Location.LocationPermissionResponse);
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
  jest
    .mocked(Location.getCurrentPositionAsync)
    .mockResolvedValue(position as Location.LocationObject);
});
afterEach(() => jest.useRealTimers());
it('launches only photographs without editing, EXIF or base64 data', async () => {
  jest
    .mocked(ImagePicker.launchCameraAsync)
    .mockResolvedValue({ canceled: true, assets: null });
  await captureServices.takePhoto();
  expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
    exif: false,
    base64: false,
  });
});
it('captures actual foreground coordinates and precision with timestamp', async () => {
  expect(await captureServices.captureLocation()).toEqual({
    latitude: -39.6,
    longitude: -72.3,
    accuracy: 8,
    capturedAt: '2026-10-14T12:00:00.000Z',
  });
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
    accuracy: Location.Accuracy.Balanced,
  });
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});
it('does not read a position after permanent permission denial', async () => {
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: false,
  } as Location.LocationPermissionResponse);
  await expect(captureServices.captureLocation()).rejects.toThrow('Ajustes');
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
it('requests only foreground permission when it can be asked again', async () => {
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  await expect(captureServices.captureLocation()).rejects.toThrow('denegada');
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
it.each([null, -1, NaN])(
  'rejects missing or invalid precision instead of inventing it: %s',
  async (accuracy) => {
    jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      ...position,
      coords: { ...position.coords, accuracy },
    } as Location.LocationObject);
    await expect(captureServices.captureLocation()).rejects.toThrow(
      'precisión',
    );
  },
);
it('reports disabled location services without requesting coordinates', async () => {
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(false);
  await expect(captureServices.captureLocation()).rejects.toThrow(
    'desactivada',
  );
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});
it('ends a hanging location request after 20 seconds and clears the timeout', async () => {
  jest.useFakeTimers();
  jest
    .mocked(Location.getCurrentPositionAsync)
    .mockReturnValue(new Promise(() => {}));
  const capture = captureServices.captureLocation();
  const assertion = expect(capture).rejects.toThrow('tardó demasiado');
  await jest.advanceTimersByTimeAsync(20_000);
  await assertion;
  expect(jest.getTimerCount()).toBe(0);
});
