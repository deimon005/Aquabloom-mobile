import type { ButtonProps } from 'react-native';
import { AppButton } from './AppButton';

export function ActionButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  return (
    <AppButton
      onPress={(event) => onPress?.(event)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      variant="secondary"
    >
      {title}
    </AppButton>
  );
}
