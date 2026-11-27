import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import { tokens } from '../theme/tokens';

type AppButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  testID?: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

export function AppButton({
  accessibilityHint,
  accessibilityLabel,
  testID,
  children,
  disabled = false,
  onPress,
  style,
  variant = 'primary',
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={
          variant === 'primary' ? styles.primaryText : styles.secondaryText
        }
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radiusSmall,
  },
  primary: { backgroundColor: tokens.colors.primary },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.colors.borderStrong,
    backgroundColor: tokens.colors.surface,
  },
  primaryText: {
    color: tokens.colors.surface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryText: {
    color: tokens.colors.heading,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.52 },
});
