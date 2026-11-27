import { fireEvent, screen } from '@testing-library/react-native';
import { render } from '../../services/__tests__/renderWithServices';
import { AppButton } from '../AppButton';

describe('AppButton', () => {
  it('expone rol, etiqueta y una superficie táctil mínima', async () => {
    const onPress = jest.fn();
    await render(<AppButton onPress={onPress}>Continuar</AppButton>);

    const button = screen.getByRole('button', { name: 'Continuar' });
    expect(button).toHaveStyle({ minHeight: 48, minWidth: 48 });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('comunica y respeta el estado deshabilitado', async () => {
    const onPress = jest.fn();
    await render(
      <AppButton disabled onPress={onPress}>
        Guardando
      </AppButton>,
    );

    const button = screen.getByRole('button', { name: 'Guardando' });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
