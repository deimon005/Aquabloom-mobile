import {
  CaptureError,
  type CaptureServices,
} from '../../domain/observations/captureTypes';

function unsupported(): never {
  throw new CaptureError(
    'unavailable',
    'La captura de cámara y ubicación está disponible en Android/iOS. En web puedes editar el borrador de texto.',
  );
}
export const captureServices: CaptureServices = {
  cameraPermission: async () => unsupported(),
  takePhoto: async () => unsupported(),
  captureLocation: async () => unsupported(),
};
