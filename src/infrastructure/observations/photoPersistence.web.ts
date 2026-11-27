import type { PhotoStorage } from '../../domain/observations/photoStorage';
export const photoPersistence: PhotoStorage = {
  async prepare() {
    throw new Error('La persistencia fotográfica requiere Android/iOS.');
  },
  async removeCreated() {},
  async removeDraft() {},
};
