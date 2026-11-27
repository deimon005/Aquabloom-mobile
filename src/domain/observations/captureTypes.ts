import type { ObservationValues } from './observationSchema';

export type ObservationLocation = NonNullable<ObservationValues['location']>;
export type CapturePermission = { granted: boolean; canAskAgain: boolean };
export type PhotoCapture = { uri: string; width: number; height: number };
export type CaptureServices = {
  cameraPermission: () => Promise<CapturePermission>;
  takePhoto: () => Promise<PhotoCapture | null>;
  captureLocation: () => Promise<ObservationLocation>;
};
export class CaptureError extends Error {
  constructor(
    public readonly kind: 'denied' | 'settings' | 'unavailable' | 'invalid',
    message: string,
  ) {
    super(message);
    this.name = 'CaptureError';
  }
}
export function captureMessage(error: unknown) {
  return error instanceof CaptureError
    ? error.message
    : 'No pudimos completar la captura. Tus datos siguen aquí; vuelve a intentarlo.';
}
