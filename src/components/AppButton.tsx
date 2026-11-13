import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { tokens } from '../theme/tokens';

type AppButtonProps = {
  accessibilityHint?: string;
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

export function AppButton({
  accessibilityHint,
  children,
  disabled = false,
  onPress,
  style,
  variant = 'primary',
}: AppButtonProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
        focused && !disabled && styles.focused,
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
    borderRadius: tokens.radius,
  },
  primary: { backgroundColor: tokens.colors.primary },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
  },
  primaryText: {
    color: tokens.colors.surface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryText: {
    color: tokens.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.52 },
  focused: {
    outlineColor: tokens.colors.text,
    outlineOffset: 2,
    outlineStyle: 'solid',
    outlineWidth: 3,
  },
});
