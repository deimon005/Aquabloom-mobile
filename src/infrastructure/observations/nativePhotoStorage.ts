import { Directory, File, Paths } from 'expo-file-system';
import {
  scopeSegment,
  type PhotoScope,
  type PhotoStorage,
} from '../../domain/observations/photoStorage';

function directory(scope: PhotoScope) {
  const segments = scopeSegment(
    JSON.stringify([scope.apiScope, scope.ownerId]),
  ).match(/.{1,96}/g)!;
  return new Directory(
    Paths.document,
    'observation-photos-v1',
    ...segments,
    scopeSegment(scope.draftId),
  );
}
function managed(uri: string, scope: PhotoScope) {
  const parent = directory(scope).uri.replace(/\/$/, '');
  return (
    uri.startsWith(parent + '/') &&
    /^[a-z0-9-]+\.(jpg|jpeg|png|heic|webp)$/i.test(uri.slice(parent.length + 1))
  );
}
export const nativePhotoStorage: PhotoStorage = {
  async removeDraft(scope) {
    const dir = directory(scope);
    if (dir.exists) dir.delete();
  },
  async prepare(uri, scope) {
    if (!uri.startsWith('file://'))
      throw new Error('La fotografía debe ser un archivo local.');
    const source = new File(uri);
    if (!source.exists || source.size <= 0)
      throw new Error('La fotografía ya no está disponible.');
    if (managed(uri, scope)) return { uri, created: false };
    const dir = directory(scope);
    dir.create({ intermediates: true, idempotent: true });
    const extension = /^\.(jpg|jpeg|png|heic|webp)$/i.test(source.extension)
      ? source.extension.toLowerCase()
      : '.jpg';
    const target = new File(
      dir,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
    );
    try {
      source.copy(target);
      if (!target.exists || target.size <= 0 || target.size !== source.size)
        throw new Error('No se pudo conservar la fotografía.');
      return { uri: target.uri, created: true };
    } catch (error) {
      if (target.exists) target.delete();
      throw error;
    }
  },
  async removeCreated(uri, scope) {
    if (!managed(uri, scope))
      throw new Error('Archivo fuera del ámbito de la observación.');
    const file = new File(uri);
    if (file.exists) file.delete();
  },
};
