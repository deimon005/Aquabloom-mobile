import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';
import { useAppServices } from '../../shared/services/AppServicesProvider';
import { useCurrentUser } from '../useCurrentUser';

jest.mock('../../shared/services/AppServicesProvider');
jest.mock('../useCurrentUser');
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
  Redirect: jest.fn(() => null),
  useLocalSearchParams: () => ({}),
}));
const register = jest.fn();
beforeEach(() => {
  register.mockReset();
  jest
    .mocked(useAppServices)
    .mockReturnValue({ auth: { signUpWithPassword: register } } as never);
  jest
    .mocked(useCurrentUser)
    .mockReturnValue({ user: null, status: 'ready' } as never);
});
async function fillForm() {
  await fireEvent.changeText(
    screen.getByLabelText('Nombre completo'),
    'Persona de prueba',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Correo electrónico'),
    'user@example.com',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Contraseña'),
    'A-password-test-123',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Confirmar contraseña'),
    'A-password-test-123',
  );
}
it('shows email confirmation only after a successful registration', async () => {
  register.mockResolvedValue({ requiresEmailConfirmation: true });
  await render(<RegisterScreen />);
  await fillForm();
  await fireEvent.press(screen.getByText('Registrarme'));
  expect(
    await screen.findByText(
      'Revisa tu correo y confirma tu cuenta antes de iniciar sesión.',
    ),
  ).toBeTruthy();
  expect(register).toHaveBeenCalledTimes(1);
});
it('keeps the form and explains a duplicate account', async () => {
  register.mockRejectedValue({ code: 'email_exists' });
  await render(<RegisterScreen />);
  await fillForm();
  await fireEvent.press(screen.getByText('Registrarme'));
  expect(
    await screen.findByText(
      'Ya existe una cuenta con ese correo. Inicia sesión.',
    ),
  ).toBeTruthy();
  expect(screen.getByLabelText('Correo electrónico').props.value).toBe(
    'user@example.com',
  );
});
it('does not submit mismatched passwords or offer privileged roles', async () => {
  await render(<RegisterScreen />);
  await fillForm();
  await fireEvent.changeText(
    screen.getByLabelText('Confirmar contraseña'),
    'different',
  );
  await fireEvent.press(screen.getByText('Registrarme'));
  await waitFor(() =>
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy(),
  );
  expect(register).not.toHaveBeenCalled();
  expect(screen.queryByText('Administrador')).toBeNull();
});
