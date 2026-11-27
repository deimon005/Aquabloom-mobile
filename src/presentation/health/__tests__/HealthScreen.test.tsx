import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { HealthScreen } from '../HealthScreen';
import { createHttpClient } from '../../../infrastructure/shared/http';
import { api } from '../../../composition/api';

jest.mock('../../../composition/api', () => ({ api: jest.fn() }));
jest.mock('../../../infrastructure/shared/config/env', () => ({
  environment: { success: true },
}));

const mockApi = jest.mocked(api!);

function renderHealth() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <HealthScreen />
    </QueryClientProvider>,
  );
}

it('requests /health and displays success only after the response', async () => {
  let complete!: (value: unknown) => void;
  mockApi.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  await renderHealth();
  expect(screen.getByText('Comprobando API…')).toBeTruthy();
  expect(screen.queryByText('API disponible')).toBeNull();
  expect(mockApi).toHaveBeenCalledWith(
    '/health',
    expect.objectContaining({ signal: expect.anything() }),
  );
  complete({ status: 'ok' });
  expect(await screen.findByText('API disponible')).toBeTruthy();
});

it('handles an HTTP failure and lets the user retry successfully', async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
  mockApi.mockImplementation(
    createHttpClient('https://example.com/api/v1', undefined, fetcher),
  );
  await renderHealth();
  expect(
    await screen.findByText('No se pudo completar la solicitud (503).'),
  ).toBeTruthy();
  expect(screen.queryByText('API disponible')).toBeNull();
  await fireEvent.press(screen.getByText('Reintentar'));
  expect(await screen.findByText('API disponible')).toBeTruthy();
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[1][0]).toBe('https://example.com/api/v1/health');
});
