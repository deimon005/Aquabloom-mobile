import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { createCameraCapture } from '../application/cameraCapture';
import {
  CaptureError,
  type CaptureServices,
} from '../application/captureTypes';
import { observationLocationSchema } from '../domain/observationSchema';

const camera = createCameraCapture({
  getPermission: ImagePicker.getCameraPermissionsAsync,
  requestPermission: ImagePicker.requestCameraPermissionsAsync,
  launch: () =>
    ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      exif: false,
      base64: false,
    }),
});
export const captureServices: CaptureServices = {
  ...camera,
  openSettings: () => Linking.openSettings(),
  async captureLocation() {
    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && permission.canAskAgain)
      permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted)
      throw new CaptureError(
        permission.canAskAgain ? 'denied' : 'settings',
        permission.canAskAgain
          ? 'Ubicación denegada. Puedes reintentar o guardar un borrador incompleto.'
          : 'Habilita la ubicación de AquaBloom en Ajustes para completar la captura.',
      );
    if (!(await Location.hasServicesEnabledAsync()))
      throw new CaptureError(
        'unavailable',
        'La ubicación del dispositivo está desactivada. Puedes reintentar sin perder tus datos.',
      );
    // Current position only: no background tracking or old last-known coordinates.
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new CaptureError(
                  'unavailable',
                  'La ubicación tardó demasiado. Reintenta; no se guardaron coordenadas inventadas.',
                ),
              ),
            20_000,
          );
        }),
      ]);
      const parsed = observationLocationSchema.safeParse({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date(position.timestamp).toISOString(),
      });
      if (!parsed.success)
        throw new CaptureError(
          'invalid',
          'La posición no incluye coordenadas y precisión válidas. Reintenta la captura.',
        );
      return parsed.data;
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};
