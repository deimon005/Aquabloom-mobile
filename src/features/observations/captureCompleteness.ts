export function captureCompleteness(
  photoUri: string | null,
  unavailablePhotoUri: string | null,
  hasLocation: boolean,
) {
  const needsPhoto = !photoUri || unavailablePhotoUri === photoUri;
  if (needsPhoto && !hasLocation)
    return {
      complete: false,
      message: 'Captura incompleta · Faltan fotografía disponible y ubicación.',
    };
  if (needsPhoto)
    return {
      complete: false,
      message: 'Captura incompleta · Falta una fotografía disponible.',
    };
  if (!hasLocation)
    return {
      complete: false,
      message: 'Captura incompleta · Falta ubicación.',
    };
  return {
    complete: true,
    message:
      'Foto y ubicación disponibles. Esto no implica envío ni validación.',
  };
}
