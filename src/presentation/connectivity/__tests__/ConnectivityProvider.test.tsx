import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { act, screen } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { Text } from 'react-native';
import { ConnectivityProvider, useConnectivity } from '../ConnectivityProvider';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
}));

const mockedAddEventListener = jest.mocked(NetInfo.addEventListener);

function ConnectivityProbe() {
  return <Text>{useConnectivity()}</Text>;
}

describe('ConnectivityProvider', () => {
  let listener: (state: NetInfoState) => void;

  beforeEach(() => {
    jest.spyOn(onlineManager, 'setOnline');
    mockedAddEventListener.mockImplementation((nextListener) => {
      listener = nextListener;
      return jest.fn();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publica cambios y pausa consultas al perder conectividad', async () => {
    await render(
      <ConnectivityProvider>
        <ConnectivityProbe />
      </ConnectivityProvider>,
    );
    expect(screen.getByText('unknown')).toBeTruthy();

    await act(() => {
      listener({
        isConnected: false,
        isInternetReachable: null,
      } as NetInfoState);
    });

    expect(screen.getByText('offline')).toBeTruthy();
    expect(onlineManager.setOnline).toHaveBeenLastCalledWith(false);
  });

  it('reanuda consultas cuando vuelve internet', async () => {
    await render(
      <ConnectivityProvider>
        <ConnectivityProbe />
      </ConnectivityProvider>,
    );

    await act(() => {
      listener({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState);
    });

    expect(screen.getByText('online')).toBeTruthy();
    expect(onlineManager.setOnline).toHaveBeenLastCalledWith(true);
  });
});
