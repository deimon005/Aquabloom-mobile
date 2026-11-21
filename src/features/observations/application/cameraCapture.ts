import type { CapturePermission, PhotoCapture } from './captureTypes';
import { CaptureError } from './captureTypes';

type CameraPort = {
  getPermission: () => Promise<CapturePermission>;
  requestPermission: () => Promise<CapturePermission>;
  launch: () => Promise<{ canceled: boolean; assets: PhotoCapture[] | null }>;
};
export function createCameraCapture(port: CameraPort) {
  return {
    async cameraPermission() {
      const current = await port.getPermission();
      if (current.granted || !current.canAskAgain) return current;
      return port.requestPermission();
    },
    async takePhoto() {
      const result = await port.launch();
      if (result.canceled) return null;
      const photo = result.assets?.[0];
      if (
        !photo ||
        !photo.uri.startsWith('file://') ||
        !Number.isFinite(photo.width) ||
        !Number.isFinite(photo.height) ||
        photo.width <= 0 ||
        photo.height <= 0
      ) {
        throw new CaptureError(
          'invalid',
          'La cámara no entregó una fotografía válida. Conservamos la foto anterior.',
        );
      }
      return photo;
    },
  };
}
