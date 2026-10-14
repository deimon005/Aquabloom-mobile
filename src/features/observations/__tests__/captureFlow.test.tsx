import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ObservationForm } from '../ObservationForm';
import { CaptureError, type CaptureServices } from '../captureTypes';
import type {
  ObservationValues,
  StoredObservation,
} from '../observationSchema';

jest.mock('../../map/LakeMap', () => ({ LakeMap: () => null }));

jest.mock('../captureServices', () => ({ captureServices: {} }));
const lakeId = '11111111-1111-4111-8111-111111111111';
const location = {
  latitude: -39.64,
  longitude: -72.33,
  accuracy: 6,
  capturedAt: '2026-10-14T12:00:00Z',
};
const photo = { uri: 'file:///camera/new.jpg', width: 800, height: 600 };
function saved(values: ObservationValues): StoredObservation {
  return {
    version: 1,
    id: lakeId,
    ownerId: 'franco',
    apiScope: 'test',
    values,
    savedAt: '2026-10-14T12:00:00Z',
    status: 'pending_send',
  };
}
async function fixture(initial?: StoredObservation) {
  const capture = {
    cameraPermission: jest.fn(async () => ({
      granted: true,
      canAskAgain: true,
    })),
    takePhoto: jest.fn(async () => photo as typeof photo | null),
    captureLocation: jest.fn(async () => location),
  } satisfies CaptureServices;
  const save = jest.fn(async (values: ObservationValues) => saved(values));
  const view = await render(
    <ObservationForm
      lakeId={lakeId}
      lakeName="Panguipulli"
      durability="device"
      initial={initial}
      capture={capture}
      onSave={save}
    />,
  );
  return { capture, save, view };
}
it.each([true, false])(
  'handles camera denial without losing edits, canAskAgain=%s',
  async (canAskAgain) => {
    const { capture, save } = await fixture();
    capture.cameraPermission.mockResolvedValue({ granted: false, canAskAgain });
    await fireEvent.changeText(
      screen.getByLabelText('Nota de terreno'),
      'Nota conservada',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tomar fotografía' }),
    );
    expect(
      screen.getByText(
        canAskAgain
          ? 'Cámara denegada. Puedes reintentar o continuar con el borrador sin foto.'
          : 'Habilita la cámara de AquaBloom en Ajustes para tomar una fotografía. Tus datos siguen aquí.',
      ),
    ).toBeTruthy();
    expect(capture.takePhoto).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nota de terreno').props.value).toBe(
      'Nota conservada',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Guardar borrador local' }),
    );
    expect(save.mock.calls[0][0].photoUri).toBeNull();
  },
);
it('cancels a replacement without discarding the old photo, note or timestamp', async () => {
  const initial = saved({
    lakeId,
    observedAt: location.capturedAt,
    note: 'Original',
    location,
    photoUri: 'file:///documents/old.jpg',
  });
  const { capture } = await fixture(initial);
  capture.takePhoto.mockResolvedValue(null);
  const date = screen.getByLabelText('Fecha y hora de la observación').props
    .value;
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Editada',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Reemplazar fotografía' }),
  );
  expect(
    screen.getByLabelText('Vista previa de la fotografía de terreno').props
      .source.uri,
  ).toBe(initial.values.photoUri);
  expect(screen.getByLabelText('Nota de terreno').props.value).toBe('Editada');
  expect(
    screen.getByLabelText('Fecha y hora de la observación').props.value,
  ).toBe(date);
  expect(
    screen.getByText(
      'Captura cancelada. Conservamos la fotografía anterior y los demás campos.',
    ),
  ).toBeTruthy();
});
it('replaces one photo, adds current coordinates and saves a complete local pending observation', async () => {
  const { capture, save } = await fixture();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Tomar fotografía' }),
  );
  expect(
    screen.getByLabelText('Vista previa de la fotografía de terreno').props
      .source.uri,
  ).toBe(photo.uri);
  capture.takePhoto.mockResolvedValue({
    ...photo,
    uri: 'file:///camera/replacement.jpg',
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Reemplazar fotografía' }),
  );
  expect(
    screen.getAllByLabelText('Vista previa de la fotografía de terreno'),
  ).toHaveLength(1);
  expect(
    screen.getByRole('button', { name: 'Finalizar observación' }),
  ).toBeDisabled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Capturar ubicación' }),
  );
  expect(
    screen.getByLabelText('Mapa de posición capturada y lago seleccionado'),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Finalizar observación' }),
  ).toBeEnabled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Finalizar observación' }),
  );
  expect(save.mock.calls[0][0]).toMatchObject({
    location,
    photoUri: 'file:///camera/replacement.jpg',
  });
  expect(screen.getByText('Guardado local · Pendiente de envío')).toBeTruthy();
  expect(screen.getByText('Sin envío al servidor · No validado')).toBeTruthy();
});
it('keeps a previous location and photograph after failures and permits retry', async () => {
  const initial = saved({
    lakeId,
    observedAt: location.capturedAt,
    note: 'Original',
    location,
    photoUri: 'file:///documents/old.jpg',
  });
  const { capture } = await fixture(initial);
  capture.captureLocation.mockRejectedValueOnce(
    new CaptureError('unavailable', 'GPS no disponible.'),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Actualizar ubicación' }),
  );
  expect(screen.getByText('GPS no disponible.')).toBeTruthy();
  expect(screen.getByText(/Precisión: 6.0 m/)).toBeTruthy();
  capture.takePhoto.mockRejectedValueOnce(new Error('private hardware trace'));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Reemplazar fotografía' }),
  );
  expect(screen.queryByText('private hardware trace')).toBeNull();
  expect(
    screen.getByLabelText('Vista previa de la fotografía de terreno').props
      .source.uri,
  ).toBe(initial.values.photoUri);
});
it('does not allow saving while permission or capture is still pending', async () => {
  const { capture, save } = await fixture();
  let finish!: (value: { granted: boolean; canAskAgain: boolean }) => void;
  capture.cameraPermission.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Tomar fotografía' }),
  );
  expect(screen.getByLabelText('Nota de terreno')).toBeDisabled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  expect(save).not.toHaveBeenCalled();
  await act(async () => finish({ granted: true, canAskAgain: true }));
  expect(screen.getByLabelText('Nota de terreno')).toBeEnabled();
});
it('ignores a late photo result after leaving the form', async () => {
  const { capture, view, save } = await fixture();
  let finish!: (value: typeof photo) => void;
  capture.takePhoto.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Tomar fotografía' }),
  );
  await view.unmount();
  await act(async () => finish(photo));
  expect(save).not.toHaveBeenCalled();
});
it('blocks finalization when the selected photograph cannot be previewed', async () => {
  const { capture } = await fixture();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Tomar fotografía' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Capturar ubicación' }),
  );
  await fireEvent(
    screen.getByLabelText('Vista previa de la fotografía de terreno'),
    'error',
  );
  expect(
    screen.getByRole('button', { name: 'Finalizar observación' }),
  ).toBeDisabled();
  expect(
    screen.getByText(
      'La fotografía no está disponible para vista previa. Reemplázala antes de completar la observación.',
    ),
  ).toBeTruthy();
  capture.takePhoto.mockResolvedValue({
    ...photo,
    uri: 'file:///camera/working.jpg',
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Reemplazar fotografía' }),
  );
  expect(
    screen.getByRole('button', { name: 'Finalizar observación' }),
  ).toBeEnabled();
});
