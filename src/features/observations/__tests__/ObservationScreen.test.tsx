import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ObservationScreen } from '../ObservationScreen';
import { useCurrentUser } from '../../auth/useCurrentUser';
import { useLakeDetail } from '../../lakes/useLakeDetail';
import { observationStore } from '../observationStore';
import { photoPersistence } from '../photoPersistence';

jest.mock('../../map/LakeMap', () => ({ LakeMap: () => null }));

jest.mock('../../auth/useCurrentUser');
jest.mock('../captureServices', () => ({
  captureServices: {
    cameraPermission: jest.fn(),
    takePhoto: jest.fn(),
    captureLocation: jest.fn(),
  },
}));
jest.mock('../photoPersistence', () => ({
  photoPersistence: { prepare: jest.fn(), removeCreated: jest.fn() },
}));
jest.mock('../../lakes/useLakeDetail');
jest.mock('../observationStore', () => ({
  observationStore: {
    durability: 'device',
    latest: jest.fn(),
    save: jest.fn(),
  },
}));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
}));
const lakeId = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  jest
    .mocked(useCurrentUser)
    .mockReturnValue({ user: { id: 'franco' }, status: 'ready' } as ReturnType<
      typeof useCurrentUser
    >);
  jest.mocked(useLakeDetail).mockReturnValue({
    data: { name: 'Panguipulli' },
    isPending: false,
    isError: false,
  } as ReturnType<typeof useLakeDetail>);
  jest.mocked(observationStore.latest).mockReset().mockResolvedValue(null);
  jest.mocked(observationStore.save).mockReset().mockResolvedValue();
});
it('keeps the same UUID across saves and associates it with the actual owner and lake', async () => {
  await render(<ObservationScreen lakeId={lakeId} />);
  await screen.findByLabelText('Nota de terreno');
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Primera nota',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  await screen.findByText('Guardado local · Pendiente de envío');
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Segunda nota',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  await screen.findByText('Guardado local · Pendiente de envío');
  const [first, second] = jest
    .mocked(observationStore.save)
    .mock.calls.map(([value]) => value);
  expect(second.id).toBe(first.id);
  expect(second).toMatchObject({
    ownerId: 'franco',
    values: { lakeId, note: 'Segunda nota' },
    status: 'pending_send',
  });
});
it('does not open storage or the form for an invalid lake', async () => {
  await render(<ObservationScreen lakeId="invalid" />);
  expect(screen.getByText('El enlace del lago no es válido.')).toBeTruthy();
  expect(observationStore.latest).not.toHaveBeenCalled();
});
it('blocks overwrite after recovery failure and permits an explicit retry', async () => {
  jest
    .mocked(observationStore.latest)
    .mockRejectedValueOnce(new Error('corrupt storage'));
  await render(<ObservationScreen lakeId={lakeId} />);
  await screen.findByText(
    'No pudimos recuperar tu borrador. Reintenta para evitar sobrescribir lo guardado.',
  );
  expect(screen.queryByLabelText('Nota de terreno')).toBeNull();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(await screen.findByLabelText('Nota de terreno')).toBeTruthy();
});
it('does not display the previous account form while the new account is loading', async () => {
  const view = await render(<ObservationScreen lakeId={lakeId} />);
  await screen.findByLabelText('Nota de terreno');
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Nota privada',
  );
  jest
    .mocked(useCurrentUser)
    .mockReturnValue({ user: { id: 'other' }, status: 'ready' } as ReturnType<
      typeof useCurrentUser
    >);
  jest.mocked(observationStore.latest).mockReturnValue(new Promise(() => {}));
  await view.rerender(<ObservationScreen lakeId={lakeId} />);
  expect(screen.queryByLabelText('Nota de terreno')).toBeNull();
  expect(screen.getByText('Preparando observación…')).toBeTruthy();
});
it('does not commit a prepared photograph after its editing session has ended', async () => {
  const record = {
    version: 1 as const,
    id: lakeId,
    ownerId: 'franco',
    apiScope: 'test',
    values: {
      lakeId,
      observedAt: '2026-10-14T12:00:00Z',
      note: 'Original',
      photoUri: 'file:///camera/photo.jpg',
      location: null,
    },
    savedAt: '2026-10-14T12:01:00Z',
    status: 'pending_send' as const,
  };
  jest.mocked(observationStore.latest).mockResolvedValueOnce(record);
  let finish!: (value: { uri: string; created: boolean }) => void;
  jest.mocked(photoPersistence.prepare).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  jest.mocked(photoPersistence.removeCreated).mockResolvedValue();
  const view = await render(<ObservationScreen lakeId={lakeId} />);
  await screen.findByLabelText('Nota de terreno');
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Editada',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  await view.unmount();
  await act(async () =>
    finish({ uri: 'file:///documents/new.jpg', created: true }),
  );
  expect(observationStore.save).not.toHaveBeenCalled();
  expect(photoPersistence.removeCreated).toHaveBeenCalledWith(
    'file:///documents/new.jpg',
    expect.objectContaining({ ownerId: 'franco', draftId: lakeId }),
  );
});
