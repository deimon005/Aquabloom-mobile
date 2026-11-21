describe('Supabase bootstrap', () => {
  afterEach(() => {
    jest.dontMock('../../config/env');
  });

  it('allows startup without credentials', () => {
    jest.isolateModules(() => {
      jest.doMock('../../config/env', () => ({ env: {} }));
      const { supabase } =
        jest.requireActual<typeof import('../auth/supabase')>(
          '../auth/supabase',
        );
      expect(supabase).toBeNull();
    });
  });

  it('creates a usable client with an initially empty secure session', async () => {
    let session!: ReturnType<
      NonNullable<
        (typeof import('../auth/supabase'))['supabase']
      >['auth']['getSession']
    >;
    jest.isolateModules(() => {
      jest.doMock('../../config/env', () => ({
        env: {
          supabaseUrl: 'https://example.supabase.co',
          supabaseKey: 'sb_publishable_test',
        },
      }));
      const { supabase } =
        jest.requireActual<typeof import('../auth/supabase')>(
          '../auth/supabase',
        );
      expect(supabase).not.toBeNull();
      expect(supabase!.from('lakes')).toBeDefined();
      session = supabase!.auth.getSession();
    });
    await expect(session).resolves.toMatchObject({
      data: { session: null },
      error: null,
    });
  });
});
