import { parseEnv } from '../env';
it('allows startup before credentials are provided', () => {
  expect(parseEnv({ apiUrl: '', supabaseUrl: '' }).success).toBe(true);
});
it('defaults to Supabase and allows local auth only with a development API', () => {
  expect(parseEnv({}, false)).toMatchObject({
    success: true,
    data: { authProvider: 'supabase' },
  });
  expect(
    parseEnv(
      { authProvider: 'local', apiUrl: 'http://127.0.0.1:8000/api/v1' },
      true,
    ).success,
  ).toBe(true);
  expect(
    parseEnv(
      { authProvider: 'local', apiUrl: 'http://127.0.0.1:8000/api/v1' },
      false,
    ).success,
  ).toBe(false);
  expect(parseEnv({ authProvider: 'local' }, true).success).toBe(false);
  expect(
    parseEnv({ authProvider: 'local', apiUrl: 'https://example.com' }, true)
      .success,
  ).toBe(false);
  expect(
    parseEnv({ authProvider: 'local', apiUrl: 'not-a-url' }, true).success,
  ).toBe(false);
  expect(parseEnv({ authProvider: 'unknown' }, true).success).toBe(false);
});
it('rejects malformed API URLs', () => {
  expect(parseEnv({ apiUrl: 'not-a-url' }).success).toBe(false);
});

it.each([
  'http://10.0.2.2:8000/api/v1',
  'http://127.0.0.1:8000/api/v1',
  'http://localhost:8000/api/v1',
])('accepts local development API addresses: %s', (apiUrl) => {
  expect(parseEnv({ apiUrl }).success).toBe(true);
});

it.each(['file:///api/v1', 'ftp://example.com/api/v1'])(
  'rejects non-HTTP API addresses: %s',
  (apiUrl) => {
    expect(parseEnv({ apiUrl }).success).toBe(false);
  },
);

it('normalizes blank configuration and surrounding whitespace', () => {
  expect(
    parseEnv({
      apiUrl: ' https://example.com/api/v1 ',
      supabaseUrl: ' ',
      supabaseKey: ' ',
    }),
  ).toMatchObject({
    success: true,
    data: {
      apiUrl: 'https://example.com/api/v1',
      supabaseUrl: undefined,
      supabaseKey: undefined,
    },
  });
});

it.each([
  { supabaseUrl: 'https://example.supabase.co' },
  { supabaseKey: 'sb_publishable_test' },
])('rejects incomplete Supabase configuration: %j', (input) => {
  expect(parseEnv(input).success).toBe(false);
});

it('accepts a complete public Supabase configuration', () => {
  expect(
    parseEnv({
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'sb_publishable_test',
    }).success,
  ).toBe(true);
});

it.each([
  'https://user:password@example.com/api/v1',
  'https://example.com/api/v1?token=example',
  'https://example.com/api/v1#health',
])('rejects an unsafe or ambiguous API base: %s', (apiUrl) => {
  expect(parseEnv({ apiUrl }).success).toBe(false);
});
