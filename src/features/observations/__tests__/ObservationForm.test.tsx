import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ObservationForm } from '../ObservationForm';
import type {
  ObservationValues,
  StoredObservation,
} from '../observationSchema';
jest.mock('../../map/LakeMap', () => ({ LakeMap: () => null }));
jest.mock('../captureServices', () => ({
  captureServices: {
    cameraPermission: jest.fn(),
    takePhoto: jest.fn(),
    captureLocation: jest.fn(),
  },
}));

const lakeId = '11111111-1111-4111-8111-111111111111';
function record(values: ObservationValues): StoredObservation {
  return {
    version: 1,
    id: lakeId,
    ownerId: 'franco',
    apiScope: 'test',
    values,
    savedAt: '2026-10-07T12:00:00Z',
    status: 'pending_send',
  };
}
async function mount(
  onSave: (values: ObservationValues) => Promise<StoredObservation> = jest.fn(
    async (values: ObservationValues) => record(values),
  ),
  durability: 'device' | 'session' = 'device',
) {
  await render(
    <ObservationForm
      lakeId={lakeId}
      lakeName="Lago Panguipulli"
      durability={durability}
      onSave={onSave}
    />,
  );
  return onSave;
}
it('shows the chosen lake and keeps finalization disabled until capture is complete', async () => {
  await mount();
  expect(
    screen.getByLabelText('Lago seleccionado: Lago Panguipulli'),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Finalizar observación' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Tomar fotografía' }),
  ).toBeEnabled();
  expect(screen.getByText('Sin envío al servidor · No validado')).toBeTruthy();
});
it('saves only valid input and returns to editing after a later change', async () => {
  const save = await mount();
  await fireEvent.changeText(
    screen.getByLabelText('Fecha y hora de la observación'),
    '2026-10-07 14:30',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    '  Agua turbia  ',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  expect(
    await screen.findByText('Guardado local · Pendiente de envío'),
  ).toBeTruthy();
  expect(save).toHaveBeenCalledWith({
    lakeId,
    observedAt: new Date(2026, 9, 7, 14, 30).toISOString(),
    note: 'Agua turbia',
    location: null,
    photoUri: null,
  });
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Cambio sin guardar',
  );
  expect(screen.getByText('En edición · Cambios sin guardar')).toBeTruthy();
  expect(
    screen.getByText(
      'Los cambios actuales aún no reemplazan el último borrador guardado.',
    ),
  ).toBeTruthy();
});
it('does not persist an impossible calendar date or oversized note', async () => {
  const save = await mount();
  await fireEvent.changeText(
    screen.getByLabelText('Fecha y hora de la observación'),
    '2026-02-30 12:00',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'a'.repeat(2001),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  expect(
    screen.getByText('Ingresa una fecha real con formato AAAA-MM-DD HH:mm.'),
  ).toBeTruthy();
  expect(
    screen.getByText('La nota admite hasta 2000 caracteres.'),
  ).toBeTruthy();
  expect(save).not.toHaveBeenCalled();
});
it('keeps edits after storage failure and supports retry without claiming success', async () => {
  const save = jest.fn(async (values: ObservationValues) => record(values));
  save.mockRejectedValueOnce(new Error('private disk trace'));
  await mount(save);
  await fireEvent.changeText(
    screen.getByLabelText('Nota de terreno'),
    'Conservar esta nota',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  expect(
    await screen.findByText(
      'No pudimos guardar el borrador. Tus cambios siguen aquí; vuelve a intentarlo.',
    ),
  ).toBeTruthy();
  expect(screen.getByLabelText('Nota de terreno').props.value).toBe(
    'Conservar esta nota',
  );
  expect(screen.queryByText('Guardado local · Pendiente de envío')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  expect(
    await screen.findByText('Guardado local · Pendiente de envío'),
  ).toBeTruthy();
});
it('waits for the storage acknowledgement and prevents concurrent saves', async () => {
  let resolve!: (value: StoredObservation) => void;
  const save = jest.fn(
    () =>
      new Promise<StoredObservation>((done) => {
        resolve = done;
      }),
  );
  await mount(save);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Guardar borrador local' }),
  );
  expect(screen.getByText('Guardando borrador…')).toBeTruthy();
  expect(screen.getByLabelText('Nota de terreno')).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Guardando…' }));
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () =>
    resolve(
      record({
        lakeId,
        observedAt: '2026-10-07T12:00:00Z',
        note: '',
        location: null,
        photoUri: null,
      }),
    ),
  );
  expect(screen.getByText('Guardado local · Pendiente de envío')).toBeTruthy();
});
it('declares that browser preview storage does not survive reload', async () => {
  await mount(undefined, 'session');
  expect(
    screen.getByText(/Vista web: guardado sólo durante esta sesión/),
  ).toBeTruthy();
});
