import { test, expect } from '@playwright/test';

const lake = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Lago de prueba',
  region: 'Los Ríos',
  status: 'active',
  description: 'Detalle de prueba E2E',
  geom: {
    type: 'Polygon',
    coordinates: [
      [
        [-72, -39],
        [-71, -39],
        [-71, -38],
        [-72, -39],
      ],
    ],
  },
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};
test('login from guest profile, authenticated profile, catalog and lake detail', async ({
  page,
}) => {
  let authenticated = false;
  await page.route('https://auth.aquabloom.invalid/**', async (route) => {
    if (route.request().url().includes('/token?grant_type=password')) {
      expect(route.request().postDataJSON()).toMatchObject({
        email: 'demian@example.test',
        password: 'fixture-password',
      });
      authenticated = true;
      await route.fulfill({
        json: {
          access_token: 'e2e-fixture-token',
          refresh_token: 'e2e-fixture-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: '33333333-3333-4333-8333-333333333333',
            email: 'demian@example.test',
            aud: 'authenticated',
            created_at: '2026-09-01T00:00:00Z',
            app_metadata: {},
            user_metadata: {},
          },
        },
      });
    } else
      await route.fulfill({
        status: 404,
        json: { error: 'Unexpected fixture request' },
      });
  });
  await page.route('https://api.aquabloom.invalid/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/lakes')) {
      expect(authenticated).toBe(true);
      expect(route.request().headers().authorization).toBe(
        'Bearer e2e-fixture-token',
      );
    }
    if (path === '/lakes')
      await route.fulfill({
        json: { items: [lake], page: 1, page_size: 20, total: 1 },
      });
    else if (path === `/lakes/${lake.id}`) await route.fulfill({ json: lake });
    else if (path === `/lakes/${lake.id}/stations`)
      await route.fulfill({ json: [] });
    else await route.fulfill({ json: { status: 'ok' } });
  });
  await page.goto('/profile');
  await expect(
    page.getByText('Inicia sesión para ver tu perfil.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('demian@example.test', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('demian@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('fixture-password');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page
      .getByText('demian@example.test', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Catálogo' }).click();
  await page
    .getByRole('button', {
      name: `Ver detalle de ${lake.name}, ${lake.region}`,
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/lakes/${lake.id}$`));
  await expect(
    page.getByText('Estaciones de monitoreo', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(lake.description, { exact: true }).filter({ visible: true }),
  ).toBeVisible();
});
