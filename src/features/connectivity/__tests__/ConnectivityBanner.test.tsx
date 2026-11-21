import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '../presentation/ConnectivityBanner';

function renderBanner(status: 'unknown' | 'online' | 'offline') {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ConnectivityBanner status={status} />
    </SafeAreaProvider>,
  );
}

describe('ConnectivityBanner', () => {
  it('anuncia globalmente la pérdida de conexión', async () => {
    await renderBanner('offline');

    const alert = screen.getByRole('alert', { name: /Sin conexión/ });
    expect(alert.props.accessibilityLiveRegion).toBe('assertive');
    expect(screen.getByText('Sin conexión')).toBeTruthy();
    expect(screen.getByText(/Actualizaremos los datos/)).toBeTruthy();
  });

  it.each(['unknown', 'online'] as const)(
    'no ocupa espacio visual durante el estado %s',
    async (status) => {
      await renderBanner(status);
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );
});
