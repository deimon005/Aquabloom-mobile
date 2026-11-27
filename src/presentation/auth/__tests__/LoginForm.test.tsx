import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../../shared/services/__tests__/renderWithServices';
import { LoginForm } from '../LoginForm';

async function fillLogin(email: string, password: string) {
  await fireEvent.changeText(
    screen.getByLabelText('Correo electrónico'),
    email,
  );
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
}

it('does not submit when the required credentials are empty', async () => {
  const onSubmit = jest.fn(async () => undefined);
  await render(<LoginForm onSubmit={onSubmit} />);

  await fireEvent.press(screen.getByText('Iniciar sesión'));

  expect(
    await screen.findByText('Ingresa tu correo electrónico.'),
  ).toBeTruthy();
  expect(screen.getByText('Ingresa tu contraseña.')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('rejects an invalid email before authenticating', async () => {
  const onSubmit = jest.fn(async () => undefined);
  await render(<LoginForm onSubmit={onSubmit} />);
  await fillLogin('correo-invalido', 'clave-de-prueba');

  await fireEvent.press(screen.getByText('Iniciar sesión'));

  expect(
    await screen.findByText('Ingresa un correo electrónico válido.'),
  ).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('submits normalized credentials and continues after authentication', async () => {
  const onSubmit = jest.fn(async () => undefined);
  const onAuthenticated = jest.fn();
  await render(
    <LoginForm onAuthenticated={onAuthenticated} onSubmit={onSubmit} />,
  );
  await fillLogin('  franco@example.com  ', 'clave-de-prueba');

  await fireEvent.press(screen.getByText('Iniciar sesión'));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'franco@example.com',
      password: 'clave-de-prueba',
    }),
  );
  expect(onAuthenticated).toHaveBeenCalledTimes(1);
});

it('shows an actionable failure and does not continue', async () => {
  const onSubmit = jest.fn(async () => {
    throw Object.assign(new Error('Invalid login credentials'), {
      code: 'invalid_credentials',
    });
  });
  const onAuthenticated = jest.fn();
  await render(
    <LoginForm onAuthenticated={onAuthenticated} onSubmit={onSubmit} />,
  );
  await fillLogin('franco@example.com', 'clave-incorrecta');

  await fireEvent.press(screen.getByText('Iniciar sesión'));

  expect(
    await screen.findByText('El correo o la contraseña son incorrectos.'),
  ).toBeTruthy();
  expect(onAuthenticated).not.toHaveBeenCalled();
});
