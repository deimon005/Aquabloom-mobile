describe('local auth composition', () => {
  afterEach(() => {
    jest.dontMock('../../infrastructure/shared/config/env');
    jest.dontMock('../../infrastructure/auth/localAuthClient');
    jest.dontMock('../../infrastructure/auth/supabase');
    jest.dontMock('../../infrastructure/shared/http');
    jest.dontMock('../catalogCache');
  });

  it('uses the same selected auth client for login, registration and API bearer credentials', async () => {
    const client = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'synthetic-local-token',
              user: { id: 'local-user' },
            },
          },
          error: null,
        }),
        signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
        signUp: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'local-user' } } },
          error: null,
        }),
      },
    };
    const supabaseSignIn = jest.fn();
    const createLocalAuthClient = jest.fn(() => client);
    let getAccessToken!: () => Promise<string | null>;
    let composed!: typeof import('../auth');
    jest.isolateModules(() => {
      jest.doMock('../../infrastructure/shared/config/env', () => ({
        env: { authProvider: 'local', apiUrl: 'http://127.0.0.1:8000/api/v1' },
      }));
      jest.doMock('../../infrastructure/auth/localAuthClient', () => ({
        createLocalAuthClient,
      }));
      jest.doMock('../../infrastructure/auth/supabase', () => ({
        supabase: { auth: { signInWithPassword: supabaseSignIn } },
      }));
      jest.doMock('../../infrastructure/shared/http', () => ({
        createHttpClient: (_url: string, token: typeof getAccessToken) => {
          getAccessToken = token;
          return {};
        },
      }));
      jest.doMock('../catalogCache', () => ({ clearCatalogCache: jest.fn() }));
      composed = jest.requireActual('../auth');
      jest.requireActual('../api');
    });
    expect(createLocalAuthClient).toHaveBeenCalledTimes(1);
    expect(composed.authClient).toBe(client);
    const credentials = {
      email: 'test@example.com',
      password: 'synthetic-test-password',
    };
    await composed.signInWithPassword(credentials);
    await composed.signUpWithPassword({
      ...credentials,
      fullName: 'Persona de prueba',
    });
    expect(client.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(client.auth.signUp).toHaveBeenCalledTimes(1);
    expect(supabaseSignIn).not.toHaveBeenCalled();
    expect((await getAccessToken()) === 'synthetic-local-token').toBe(true);
    client.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: { status: 401 },
    });
    expect(await getAccessToken()).toBeNull();
  });
});
