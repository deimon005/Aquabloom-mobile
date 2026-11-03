import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { EstimatesScreen } from '../EstimatesScreen';
import { EstimateScreen } from '../EstimateScreen';
import { ScientificJobScreen } from '../ScientificJobScreen';
import { JobState } from '../JobState';
import { useEstimates, useScientificJob } from '../useScientific';
import { demoJobIds, loadEstimates, demoEstimateId } from '../scientificSource';
import { scientificJobStatuses } from '../jobsApi';
import { ApiError } from '../../../lib/http';
import type { EstimatePoint } from '../estimatesApi';
jest.mock('../useScientific');
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
  router: { push: jest.fn(), replace: jest.fn() },
}));
const estimates = useEstimates as jest.Mock;
const jobs = useScientificJob as jest.Mock;
const lakeId = '11111111-1111-4111-8111-111111111111';
let estimate: EstimatePoint;
const refetch = jest.fn();
beforeEach(async () => {
  jest.clearAllMocks();
  estimate = (await loadEstimates('demo', lakeId)).items[0];
  estimates.mockReturnValue({
    data: { items: [estimate] },
    isPending: false,
    isError: false,
    refetch,
  });
  jobs.mockReturnValue({
    data: {
      id: demoJobIds[1],
      status: 'running',
      updated_at: '2026-10-21T12:35:00Z',
    },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch,
  });
});
it('requires explicit opt-in to demo and shows no synthetic result in disabled mode', async () => {
  await render(<EstimatesScreen lakeId={lakeId} />);
  expect(screen.queryByText('Punto o estación: P-DEMO-01')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Abrir demostración local' }),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/lakes/[id]/estimates',
    params: { id: lakeId, demo: '1' },
  });
});
it('lists date, point, zero-safe value/unit and status then routes to the same scoped detail', async () => {
  estimates.mockReturnValue({
    data: { items: [{ ...estimate, value: 0 }] },
    refetch,
  });
  await render(<EstimatesScreen lakeId={lakeId} demo="1" />);
  expect(screen.getByText('Valor: 0 mg/m³')).toBeTruthy();
  expect(screen.getByText(/Fecha: .*UTC/)).toBeTruthy();
  expect(screen.getByText('Estado informado: experimental')).toBeTruthy();
  expect(screen.getByText(/DEMOSTRACIÓN LOCAL/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Ver estimación P-DEMO-01' }),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/lakes/[id]/estimates/[estimateId]',
    params: { id: lakeId, estimateId: demoEstimateId, demo: '1' },
  });
});
it('shows loading instead of an empty-state claim while estimates are pending', async () => {
  estimates.mockReturnValue({ isPending: true });
  await render(<EstimatesScreen lakeId={lakeId} demo="1" />);
  expect(screen.getByText('Cargando estimaciones…')).toBeTruthy();
  expect(
    screen.queryByText('No hay estimaciones disponibles para este lago.'),
  ).toBeNull();
});
it('shows a genuine empty result', async () => {
  estimates.mockReturnValue({ data: { items: [] } });
  await render(<EstimatesScreen lakeId={lakeId} demo="1" />);
  expect(
    screen.getByText('No hay estimaciones disponibles para este lago.'),
  ).toBeTruthy();
});
it('hides stale results on failure, reports permission safely and retries', async () => {
  estimates.mockReturnValue({
    data: { items: [estimate] },
    isError: true,
    error: new ApiError(403, 'private SQL'),
    refetch,
  });
  await render(<EstimatesScreen lakeId={lakeId} demo="1" />);
  expect(
    screen.getByText(
      'No tienes permiso para consultar estos datos científicos.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('private SQL')).toBeNull();
  expect(screen.queryByText('Valor: 4.2 mg/m³')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
it('renders lineage, missing versions, uncertainty warning and no-toxicity qualification', async () => {
  await render(
    <EstimateScreen lakeId={lakeId} estimateId={demoEstimateId} demo="1" />,
  );
  expect(screen.getByText('Escena de origen: scene-demo')).toBeTruthy();
  expect(screen.getByText('Versión de modelo: 0.0-demo')).toBeTruthy();
  expect(screen.getByText('Dataset: No informado')).toBeTruthy();
  expect(screen.getByText('Versión de dataset: No informado')).toBeTruthy();
  expect(
    screen.getByText(/Incertidumbre calibrada: no informada/),
  ).toBeTruthy();
  expect(screen.getByText(/Clorofila-a no equivale a toxicidad/)).toBeTruthy();
  expect(screen.getByText(estimate.warnings[0])).toBeTruthy();
});
it('does not infer missing origin or imply that missing warnings validate a result', async () => {
  estimates.mockReturnValue({
    data: {
      items: [
        {
          ...estimate,
          scene_id: null,
          model_id: ' ',
          model_version: null,
          warnings: [],
        },
      ],
    },
  });
  await render(
    <EstimateScreen lakeId={lakeId} estimateId={demoEstimateId} demo="1" />,
  );
  expect(
    screen.getByText('Origen: No informado; falta escena de origen.'),
  ).toBeTruthy();
  expect(screen.getByText('Modelo: No informado')).toBeTruthy();
  expect(
    screen.getByText(/Esto no acredita validación científica/),
  ).toBeTruthy();
});
it('rejects a result missing from the selected lake and preserves the demo return route', async () => {
  await render(
    <EstimateScreen lakeId={lakeId} estimateId={demoJobIds[0]} demo="1" />,
  );
  expect(
    screen.getByText(
      'La estimación no pertenece a este lago o ya no está disponible.',
    ),
  ).toBeTruthy();
  expect(
    screen.getByText('Volver a estimaciones del lago').props.href.params,
  ).toEqual({ id: lakeId, demo: '1' });
});
it.each(scientificJobStatuses)(
  'renders job status %s without leaking error_message or guessing progress',
  async (status) => {
    await render(
      <JobState
        job={{
          id: demoJobIds[0],
          status,
          updated_at: '2026-10-21T12:35:00Z',
          error_message: 'private SQL token',
        }}
      />,
    );
    expect(screen.getByText(/^Estado:/)).toBeTruthy();
    expect(screen.queryByText('private SQL token')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('Progreso no informado por la API.')).toBeTruthy();
  },
);
it.each([0, 30, 100])(
  'only renders accessible progress when API supplies %s',
  async (progress) => {
    await render(
      <JobState
        job={{
          id: demoJobIds[0],
          status: 'running',
          updated_at: '2026-10-21T12:35:00Z',
          progress,
        }}
      />,
    );
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(
      progress,
    );
    expect(screen.getByText(`Progreso informado: ${progress}%`)).toBeTruthy();
  },
);
it('refreshes an existing job and permits explicit synthetic status examples', async () => {
  await render(<ScientificJobScreen jobId={demoJobIds[1]} demo="1" />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Actualizar estado del trabajo' }),
  );
  expect(refetch).toHaveBeenCalledTimes(1);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Ejemplo: Cancelado' }),
  );
  expect(router.replace).toHaveBeenCalledWith({
    pathname: '/scientific/jobs/[jobId]',
    params: { jobId: demoJobIds[4], demo: '1' },
  });
});
it('supports job pending/error states and never renders a stale job after an authorization error', async () => {
  jobs.mockReturnValue({ isPending: true });
  const view = await render(
    <ScientificJobScreen jobId={demoJobIds[1]} demo="1" />,
  );
  expect(screen.getByText('Cargando trabajo…')).toBeTruthy();
  jobs.mockReturnValue({
    isError: true,
    error: new ApiError(401, 'private'),
    refetch,
  });
  await view.rerender(<ScientificJobScreen jobId={demoJobIds[1]} demo="1" />);
  expect(
    screen.getByText('Tu sesión venció. Inicia sesión nuevamente.'),
  ).toBeTruthy();
  expect(screen.queryByText('Estado: En ejecución')).toBeNull();
});
it('rejects malformed detail/job links before rendering data', async () => {
  const view = await render(
    <EstimateScreen lakeId={lakeId} estimateId="../bad" demo="1" />,
  );
  expect(
    screen.getByText('El enlace de estimación no es válido.'),
  ).toBeTruthy();
  await view.unmount();
  await render(<ScientificJobScreen jobId="../bad" demo="1" />);
  expect(
    screen.getByText('El identificador del trabajo no es válido.'),
  ).toBeTruthy();
});

it('labels cached estimates and includes the snapshot date', async () => {
  const savedAt = Date.UTC(2026, 10, 3, 12);
  estimates.mockReturnValue({ data: { items: [estimate] }, savedAt });
  await render(<EstimatesScreen lakeId={lakeId} demo="1" />);
  expect(
    screen.getByText(
      'Sin conexión. Mostrando datos guardados el ' +
        new Date(savedAt).toLocaleString('es-CL') +
        '.',
    ),
  ).toBeTruthy();
});
