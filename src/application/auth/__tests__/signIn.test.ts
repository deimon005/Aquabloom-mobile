import { AuthConfigurationError, signInWithPassword } from '../signIn';

const credentials = {
  email: 'franco@example.com',
  password: 'clave-de-prueba',
};

it('sends email and password to Supabase', async () => {
  const request = jest.fn().mockResolvedValue({ data: {}, error: null });
  const client = { auth: { signInWithPassword: request } };

  await signInWithPassword(credentials, client as never);

  expect(request).toHaveBeenCalledWith(credentials);
});

it('propagates a Supabase authentication failure', async () => {
  const failure = { code: 'invalid_credentials' };
  const client = {
    auth: {
      signInWithPassword: jest
        .fn()
        .mockResolvedValue({ data: {}, error: failure }),
    },
  };

  await expect(signInWithPassword(credentials, client as never)).rejects.toBe(
    failure,
  );
});

it('fails safely when Supabase is not configured', async () => {
  await expect(signInWithPassword(credentials, null)).rejects.toBeInstanceOf(
    AuthConfigurationError,
  );
});
