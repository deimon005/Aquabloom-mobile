/** @jest-environment node */

import { androidQaFetch } from '../http/androidQaFetch';

jest.mock('../../config/androidQa', () => ({
  qaApiUrl: 'https://api.aquabloom.invalid',
  qaAuthUrl: 'https://auth.aquabloom.invalid',
}));

it('reproduces recovery after three catalog failures and rejects unrelated traffic', async () => {
  const catalog = 'https://api.aquabloom.invalid/lakes?page=1&limit=20';
  for (let failure = 0; failure < 3; failure++) {
    expect((await androidQaFetch(catalog)).status).toBe(503);
  }
  const response = await androidQaFetch(catalog);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    items: [{ name: 'Panguipulli (prueba QA)' }],
    total: 1,
  });
  expect((await androidQaFetch(catalog, { method: 'POST' })).status).toBe(404);
  expect(
    (await androidQaFetch('https://other.aquabloom.invalid/lakes')).status,
  ).toBe(404);
});

it('accepts only the synthetic account for the password grant', async () => {
  const endpoint =
    'https://auth.aquabloom.invalid/auth/v1/token?grant_type=password';
  const signIn = (password: string) =>
    androidQaFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'franco@example.test', password }),
    });

  expect((await signIn('incorrect-password')).status).toBe(400);
  const response = await signIn('fixture-password');
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    user: { email: 'franco@example.test' },
  });
});
