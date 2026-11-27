describe('Supabase bootstrap', () => {
  afterEach(() => {
    jest.dontMock('../../shared/config/env');
    jest.dontMock('@supabase/supabase-js');
  });

  it('does not create a Supabase client when the local provider is selected', () => {
    const createClient = jest.fn();
    jest.isolateModules(() => {
      jest.doMock('../../shared/config/env', () => ({
        env: {
          authProvider: 'local',
          supabaseUrl: 'https://example.supabase.co',
          supabaseKey: 'public-test',
        },
      }));
      jest.doMock('@supabase/supabase-js', () => ({ createClient }));
      const { supabase } =
        jest.requireActual<typeof import('../supabase')>('../supabase');
      expect(supabase).toBeNull();
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('allows startup without credentials', () => {
    jest.isolateModules(() => {
      jest.doMock('../../shared/config/env', () => ({
        env: {},
      }));
      const { supabase } =
        jest.requireActual<typeof import('../supabase')>('../supabase');
      expect(supabase).toBeNull();
    });
  });

  it('creates a usable client with an initially empty secure session', async () => {
    let session!: ReturnType<
      NonNullable<
        (typeof import('../supabase'))['supabase']
      >['auth']['getSession']
    >;
    jest.isolateModules(() => {
      jest.doMock('../../shared/config/env', () => ({
        env: {
          supabaseUrl: 'https://example.supabase.co',
          supabaseKey: 'sb_publishable_test',
        },
      }));
      const { supabase } =
        jest.requireActual<typeof import('../supabase')>('../supabase');
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
