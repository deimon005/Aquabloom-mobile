import { expect, test } from '@playwright/test';

const lakeId = '11111111-1111-4111-8111-111111111111';
test.use({ viewport: { width: 390, height: 844 } });
test('scientific demo is explicit, traceable, keyboard navigable and never requests scientific APIs', async ({
  page,
}, testInfo) => {
  const scientificRequests: string[] = [];
  await page.route('https://auth.aquabloom.invalid/**', async (route) => {
    if (!route.request().url().includes('/token?grant_type=password')) {
      await route.fulfill({ status: 404, json: {} });
      return;
    }
    await route.fulfill({
      json: {
        access_token: 'e2e-fixture-token',
        refresh_token: 'e2e-fixture-refresh',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: '33333333-3333-4333-8333-333333333333',
          email: 'franco@example.test',
          aud: 'authenticated',
          created_at: '2026-10-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      },
    });
  });
  await page.route('https://api.aquabloom.invalid/**', async (route) => {
    if (/estimates|scientific\/jobs/.test(route.request().url()))
      scientificRequests.push(route.request().url());
    await route.fulfill({ json: { status: 'ok' } });
  });
  await page.goto(`/lakes/${lakeId}/estimates`);
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('franco@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('fixture-password');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/lakes/${lakeId}/estimates$`));
  const demo = page.getByRole('button', {
    name: 'Abrir demostración local',
    exact: true,
  });
  await expect(demo).toBeVisible();
  await demo.focus();
  await page.keyboard.press('Enter');
  await expect(
    page
      .getByText(/DEMOSTRACIÓN LOCAL.*Datos sintéticos/)
      .filter({ visible: true }),
  ).toBeVisible();
  const detail = page.getByRole('button', {
    name: 'Ver estimación P-DEMO-01',
    exact: true,
  });
  await detail.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('Escena de origen: scene-demo', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Versión de modelo: 0.0-demo', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Dataset: No informado', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Incertidumbre calibrada: no informada/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('scientific-detail-demo.png'),
    fullPage: true,
  });
  await page
    .getByRole('link', { name: 'Volver a estimaciones del lago', exact: true })
    .click();
  await page.context().setOffline(true);
  await expect(page.getByText('Sin conexión', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Ver trabajo de demostración', exact: true })
    .click();
  await expect(
    page.getByText('Estado: En ejecución', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Progreso informado: 30%', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ejemplo: Fallido', exact: true })
    .click();
  await expect(
    page
      .getByText('Estado: Fallido', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText('Progreso no informado por la API.', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  expect(scientificRequests).toEqual([]);
});
