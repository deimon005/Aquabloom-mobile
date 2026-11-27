import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../shared/components/AppButton';
import { tokens } from '../shared/theme/tokens';
import { getAuthErrorMessage } from './authErrorMessage';
import {
  loginSchema,
  type LoginCredentials,
} from '../../domain/auth/loginSchema';

type LoginFormProps = {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onAuthenticated?: () => void;
  localEnvironment?: boolean;
};

export function LoginForm({
  onSubmit,
  onAuthenticated,
  localEnvironment,
}: LoginFormProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const submit = handleSubmit(async (credentials) => {
    setSubmissionError(null);
    try {
      await onSubmit(credentials);
      onAuthenticated?.();
    } catch (error) {
      setSubmissionError(getAuthErrorMessage(error));
    }
  });

  return (
    <View style={styles.form}>
      {localEnvironment ? <Text>Entorno local de pruebas</Text> : null}
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value }, fieldState }) => (
          <View style={styles.field}>
            <Text nativeID="login-email-label" style={styles.label}>
              Correo electrónico
            </Text>
            <TextInput
              accessibilityLabel="Correo electrónico"
              accessibilityLabelledBy="login-email-label"
              accessibilityState={{ disabled: isSubmitting }}
              aria-invalid={Boolean(fieldState.error)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isSubmitting}
              inputMode="email"
              onBlur={onBlur}
              onChangeText={onChange}
              returnKeyType="next"
              style={[styles.input, fieldState.error && styles.inputError]}
              textContentType="emailAddress"
              value={value}
            />
            {fieldState.error && (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value }, fieldState }) => (
          <View style={styles.field}>
            <Text nativeID="login-password-label" style={styles.label}>
              Contraseña
            </Text>
            <TextInput
              accessibilityLabel="Contraseña"
              accessibilityLabelledBy="login-password-label"
              accessibilityState={{ disabled: isSubmitting }}
              aria-invalid={Boolean(fieldState.error)}
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!isSubmitting}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={() => void submit()}
              returnKeyType="done"
              secureTextEntry
              style={[styles.input, fieldState.error && styles.inputError]}
              textContentType="password"
              value={value}
            />
            {fieldState.error && (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      {submissionError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {submissionError}
        </Text>
      )}

      <AppButton
        accessibilityHint="Envía tus credenciales para acceder a AquaBloom"
        disabled={isSubmitting}
        onPress={() => void submit()}
      >
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: tokens.spacing.lg,
    padding: 20,
    borderRadius: tokens.radius,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    ...tokens.shadow,
  },
  field: { gap: tokens.spacing.sm },
  label: { color: tokens.colors.heading, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: tokens.colors.borderStrong,
    borderRadius: tokens.radiusSmall,
    backgroundColor: '#FBFDFD',
    color: tokens.colors.text,
    paddingHorizontal: tokens.spacing.md,
    fontSize: 16,
  },
  inputError: { borderColor: tokens.colors.error },
  error: { color: tokens.colors.error },
});
