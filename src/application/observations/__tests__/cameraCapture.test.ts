import { createCameraCapture } from '../cameraCapture';
const photo = { uri: 'file:///camera/photo.jpg', width: 1200, height: 800 };
function fixture() {
  const port = {
    getPermission: jest.fn(async () => ({ granted: false, canAskAgain: true })),
    requestPermission: jest.fn(async () => ({
      granted: true,
      canAskAgain: true,
    })),
    launch: jest.fn(async () => ({
      canceled: false,
      assets: [photo] as (typeof photo)[] | null,
    })),
  };
  return { port, camera: createCameraCapture(port) };
}
it('requests permission only in context and avoids asking again after permanent denial', async () => {
  const { camera, port } = fixture();
  expect(port.getPermission).not.toHaveBeenCalled();
  expect(await camera.cameraPermission()).toEqual({
    granted: true,
    canAskAgain: true,
  });
  expect(port.requestPermission).toHaveBeenCalledTimes(1);
  port.getPermission.mockResolvedValue({ granted: false, canAskAgain: false });
  expect(await camera.cameraPermission()).toEqual({
    granted: false,
    canAskAgain: false,
  });
  expect(port.requestPermission).toHaveBeenCalledTimes(1);
});
it('uses an already granted permission without an unnecessary prompt', async () => {
  const { camera, port } = fixture();
  port.getPermission.mockResolvedValue({ granted: true, canAskAgain: true });
  await camera.cameraPermission();
  expect(port.requestPermission).not.toHaveBeenCalled();
});
it('returns one photo and treats cancellation as no replacement', async () => {
  const { camera, port } = fixture();
  expect(await camera.takePhoto()).toEqual(photo);
  port.launch.mockResolvedValue({ canceled: true, assets: null });
  expect(await camera.takePhoto()).toBeNull();
});
it.each([
  { ...photo, uri: 'https://example.com/photo.jpg' },
  { ...photo, width: 0 },
  { ...photo, height: NaN },
])('rejects an invalid camera result %j', async (asset) => {
  const { camera, port } = fixture();
  port.launch.mockResolvedValue({ canceled: false, assets: [asset] });
  await expect(camera.takePhoto()).rejects.toThrow('fotografía válida');
});
