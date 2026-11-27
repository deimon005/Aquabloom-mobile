import {
  fetchScientificJob,
  parseScientificJob,
  scientificJobStatuses,
} from '../jobsApi';

const jobId = '44444444-4444-4444-8444-444444444444';

it.each(scientificJobStatuses)('reconoce el estado %s', (status) => {
  expect(
    parseScientificJob(jobId, {
      id: jobId,
      status,
      updated_at: '2026-10-06T12:30:00Z',
    }).status,
  ).toBe(status);
});

it('consulta un trabajo existente sin iniciar entrenamiento', async () => {
  const response = {
    id: jobId,
    status: 'running',
    updated_at: '2026-10-06T12:30:00Z',
    progress: 30,
  };
  const request = jest.fn(async () => response);
  const controller = new AbortController();

  await expect(
    fetchScientificJob(jobId, controller.signal, request),
  ).resolves.toEqual(response);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith(`/scientific/jobs/${jobId}`, {
    signal: controller.signal,
  });
});

it('rechaza identificadores o respuestas que no correspondan al trabajo', async () => {
  const request = jest.fn();
  await expect(
    fetchScientificJob('../other', undefined, request),
  ).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
  expect(() =>
    parseScientificJob(jobId, {
      id: '55555555-5555-4555-8555-555555555555',
      status: 'queued',
      updated_at: '2026-10-06T12:30:00Z',
    }),
  ).toThrow('otro trabajo');
  expect(() =>
    parseScientificJob(jobId, {
      id: jobId,
      status: 'unknown',
      updated_at: '2026-10-06T12:30:00Z',
    }),
  ).toThrow();
});
