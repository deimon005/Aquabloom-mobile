import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  registrationSchema,
  type RegistrationValues,
} from '../../domain/auth/registration';
import { Screen } from '../shared/components/Screen';
import { AppButton } from '../shared/components/AppButton';
import { AsyncState } from '../shared/components/AsyncState';
import { tokens } from '../shared/theme/tokens';
import { useAppServices } from '../shared/services/AppServicesProvider';
import { useCurrentUser } from './useCurrentUser';
import { getRegistrationErrorMessage } from './registrationErrorMessage';
import { loginDestination } from './loginDestination';

const fields = [
  { name: 'fullName', label: 'Nombre completo', secret: false },
  { name: 'email', label: 'Correo electrónico', secret: false },
  { name: 'password', label: 'Contraseña', secret: true },
  { name: 'confirmPassword', label: 'Confirmar contraseña', secret: true },
] as const;

export function RegisterScreen() {
  const {
    auth: { signUpWithPassword },
    config,
  } = useAppServices();
  const { user, status } = useCurrentUser();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await signUpWithPassword(values);
      setConfirmation(result.requiresEmailConfirmation);
    } catch (failure) {
      setError(getRegistrationErrorMessage(failure));
    }
  });
  if (user) return <Redirect href={loginDestination(returnTo ?? '/profile')} />;
  return (
    <Screen
      title="Crear cuenta"
      subtitle="Forma parte de una comunidad que observa y comparte conocimiento."
    >
      {config?.authProvider === 'local' ? (
        <Text>Entorno local de pruebas</Text>
      ) : null}
      {status === 'unconfigured' ? (
        <AsyncState
          kind="empty"
          message="El registro todavía no está configurado."
        />
      ) : confirmation ? (
        <>
          <Text accessibilityRole="alert">
            Revisa tu correo y confirma tu cuenta antes de iniciar sesión.
          </Text>
          <Link href="/login">Ir a iniciar sesión</Link>
        </>
      ) : (
        <View style={styles.form}>
          <Text style={styles.intro}>
            Regístrate para guardar tus observaciones de terreno. Usa una
            contraseña de 15 a 256 caracteres.
          </Text>
          {fields.map((field) => (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    accessibilityLabel={field.label}
                    aria-invalid={Boolean(fieldState.error)}
                    autoCapitalize={
                      field.name === 'fullName' ? 'words' : 'none'
                    }
                    autoCorrect={false}
                    inputMode={field.name === 'email' ? 'email' : 'text'}
                    secureTextEntry={field.secret}
                    autoComplete={
                      field.name === 'email'
                        ? 'email'
                        : field.secret
                          ? 'new-password'
                          : 'name'
                    }
                    editable={!isSubmitting}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={styles.input}
                  />
                  {fieldState.error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          ))}
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <AppButton disabled={isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
          </AppButton>
          <Link style={styles.link} href="/login">
            Ya tengo una cuenta
          </Link>
        </View>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  form: {
    gap: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
    ...tokens.shadow,
  },
  intro: { color: tokens.colors.muted, lineHeight: 21, fontSize: 14 },
  link: {
    color: tokens.colors.primary,
    textAlign: 'center',
    paddingVertical: 10,
    fontWeight: '700',
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
  error: { color: tokens.colors.error },
});
