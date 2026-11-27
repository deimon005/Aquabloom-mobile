import { screen, fireEvent } from '@testing-library/react-native';
import { render } from '../../services/__tests__/renderWithServices';
import { AsyncState } from '../AsyncState';

it('offers a retry after an error and invokes the provided action', async () => {
  const retry = jest.fn();
  await render(
    <AsyncState kind="error" message="Sin respuesta" onRetry={retry} />,
  );
  expect(screen.getByText('Sin respuesta')).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
it('announces loading without offering a retry', async () => {
  await render(<AsyncState kind="loading" message="Consultando" />);
  expect(screen.getByRole('progressbar', { name: 'Cargando' })).toBeTruthy();
  expect(
    screen.getByRole('progressbar', { name: 'Cargando' }).props
      .accessibilityState,
  ).toMatchObject({
    busy: true,
  });
  expect(screen.queryByText('Reintentar')).toBeNull();
});
