import { fetchLakeEstimates } from '../data/estimatesApi';
import { fetchScientificJob } from '../data/jobsApi';
import { scientificJobStatuses } from '../domain/job';
import {
  demoJobIds,
  loadEstimates,
  loadJob,
  scientificSource,
} from '../application/scientificSource';
import { ApiError } from '../../../lib/http';
import {
  metadata,
  scientificError,
} from '../presentation/scientificPresentation';
jest.mock('../data/estimatesApi', () => ({
  ...jest.requireActual('../data/estimatesApi'),
  fetchLakeEstimates: jest.fn(),
}));
jest.mock('../data/jobsApi', () => ({
  ...jest.requireActual('../data/jobsApi'),
  fetchScientificJob: jest.fn(),
}));
const lakeId = '11111111-1111-4111-8111-111111111111';
beforeEach(() => jest.clearAllMocks());
it('keeps disabled routes quiet and never silently substitutes demo data', async () => {
  expect(scientificSource(undefined)).toBe('disabled');
  expect(scientificSource(['1'])).toBe('disabled');
  expect(scientificSource('1')).toBe('demo');
  await expect(loadEstimates('disabled', lakeId)).rejects.toThrow('pendiente');
  await expect(loadJob('disabled', demoJobIds[0])).rejects.toThrow('pendiente');
  expect(fetchLakeEstimates).not.toHaveBeenCalled();
  expect(fetchScientificJob).not.toHaveBeenCalled();
});
it('scopes synthetic estimates to the selected lake without network or invented metadata', async () => {
  const response = await loadEstimates('demo', lakeId);
  expect(response.items).toHaveLength(1);
  expect(response.items[0]).toMatchObject({
    lake_id: lakeId,
    point_id: 'P-DEMO-01',
    dataset_id: null,
  });
  expect(fetchLakeEstimates).not.toHaveBeenCalled();
});
it.each(scientificJobStatuses)(
  'provides a clearly synthetic %s job without writing or networking',
  async (status) => {
    const job = await loadJob(
      'demo',
      demoJobIds[scientificJobStatuses.indexOf(status)],
    );
    expect(job.status).toBe(status);
    expect(job.progress).toBe(status === 'running' ? 30 : undefined);
    expect(fetchScientificJob).not.toHaveBeenCalled();
  },
);
it('only calls proposal adapters explicitly and propagates AbortSignal', async () => {
  const controller = new AbortController();
  await loadEstimates('proposal', lakeId, controller.signal);
  await loadJob('proposal', demoJobIds[0], controller.signal);
  expect(fetchLakeEstimates).toHaveBeenCalledWith(lakeId, controller.signal);
  expect(fetchScientificJob).toHaveBeenCalledWith(
    demoJobIds[0],
    controller.signal,
  );
});
it('rejects malformed ids, unknown demo jobs and cancelled reads', async () => {
  await expect(loadEstimates('demo', '../invalid')).rejects.toThrow();
  await expect(loadJob('demo', lakeId)).rejects.toThrow('inexistente');
  const controller = new AbortController();
  controller.abort();
  await expect(
    loadEstimates('proposal', lakeId, controller.signal),
  ).rejects.toThrow('cancelada');
  await expect(
    loadJob('proposal', demoJobIds[0], controller.signal),
  ).rejects.toThrow('cancelada');
  expect(fetchLakeEstimates).not.toHaveBeenCalled();
  expect(fetchScientificJob).not.toHaveBeenCalled();
});
it.each([401, 403, 404, 500])(
  'hides raw server traces for status %s',
  (status) => {
    expect(
      scientificError(new ApiError(status, 'SQL password=secret')),
    ).not.toContain('secret');
    expect(scientificError(new Error('private stack'))).not.toContain(
      'private',
    );
  },
);
it('labels null, whitespace and missing metadata without guessing versions', () => {
  expect(metadata(null)).toBe('No informado');
  expect(metadata('   ')).toBe('No informado');
  expect(metadata(undefined)).toBe('No informado');
  expect(metadata(' v2 ')).toBe('v2');
});
