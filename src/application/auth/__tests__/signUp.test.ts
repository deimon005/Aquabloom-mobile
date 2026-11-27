import { signUpWithPassword } from '../signUp';
import { AuthConfigurationError } from '../../../domain/auth/auth';
import { registrationSchema } from '../../../domain/auth/registration';

const credentials = {
  fullName: 'Persona de prueba',
  email: 'user@example.com',
  password: 'A-password-test-123',
};
it('registers only the name as user-editable metadata and reports confirmation', async () => {
  const signUp = jest
    .fn()
    .mockResolvedValue({ data: { session: null }, error: null });
  const result = await signUpWithPassword(
    { ...credentials, role: 'administrador' } as typeof credentials,
    { auth: { signUp } },
  );
  expect(signUp).toHaveBeenCalledWith({
    email: credentials.email,
    password: credentials.password,
    options: { data: { full_name: credentials.fullName } },
  });
  expect(result.requiresEmailConfirmation).toBe(true);
});
it('recognizes an immediately authenticated registration', async () => {
  const signUp = jest
    .fn()
    .mockResolvedValue({ data: { session: { user: {} } }, error: null });
  expect(await signUpWithPassword(credentials, { auth: { signUp } })).toEqual({
    requiresEmailConfirmation: false,
  });
});
it('propagates registration errors without inventing success', async () => {
  const error = { code: 'email_exists' };
  const signUp = jest
    .fn()
    .mockResolvedValue({ data: { session: null }, error });
  await expect(
    signUpWithPassword(credentials, { auth: { signUp } }),
  ).rejects.toBe(error);
  await expect(signUpWithPassword(credentials, null)).rejects.toBeInstanceOf(
    AuthConfigurationError,
  );
});
it('rejects mismatched passwords and accepts a valid registration', () => {
  expect(
    registrationSchema.safeParse({
      ...credentials,
      confirmPassword: 'different',
    }).success,
  ).toBe(false);
  expect(
    registrationSchema.safeParse({
      ...credentials,
      confirmPassword: credentials.password,
    }).success,
  ).toBe(true);
});

it.each([14, 257])(
  'rejects new registration passwords of length %i',
  (length) => {
    const password = 'p'.repeat(length);
    expect(
      registrationSchema.safeParse({
        ...credentials,
        password,
        confirmPassword: password,
      }).success,
    ).toBe(false);
  },
);
it.each([15, 256])(
  'accepts new registration passwords of length %i',
  (length) => {
    const password = 'p'.repeat(length);
    expect(
      registrationSchema.safeParse({
        ...credentials,
        password,
        confirmPassword: password,
      }).success,
    ).toBe(true);
  },
);
