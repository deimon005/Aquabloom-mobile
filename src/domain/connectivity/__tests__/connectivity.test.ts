import { resolveConnectivityStatus } from '../connectivity';

describe('resolveConnectivityStatus', () => {
  it('mantiene el estado indeterminado mientras la plataforma inicializa', () => {
    expect(
      resolveConnectivityStatus({
        isConnected: null,
        isInternetReachable: null,
      }),
    ).toBe('unknown');
  });

  it('considera online una red conectada con alcance todavía indeterminado', () => {
    expect(
      resolveConnectivityStatus({
        isConnected: true,
        isInternetReachable: null,
      }),
    ).toBe('online');
  });

  it.each([
    { isConnected: false, isInternetReachable: null },
    { isConnected: true, isInternetReachable: false },
  ])('prioriza cualquier señal explícita sin conexión: %o', (state) => {
    expect(resolveConnectivityStatus(state)).toBe('offline');
  });
});
