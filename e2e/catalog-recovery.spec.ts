import { expect, test } from '@playwright/test';

const lake = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Lago Panguipulli',
  region: 'Los Ríos',
  status: 'active',
  description: 'Ficha de prueba, no es una consulta a producción.',
  geom: {},
  created_at: '2026-11-03T00:00:00Z',
  updated_at: '2026-11-03T00:00:00Z',
};

test.use({ viewport: { width: 360, height: 800 } });

test('catalog recovers after bounded startup failures and opens Panguipulli without stations', async ({
  page,
}, testInfo) => {
  let initialAttempts = 0;
  await page.route('https://api.aquabloom.invalid/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/lakes') {
      if (url.searchParams.get('text')) {
        await route.fulfill({
          json: { items: [], page: 1, page_size: 20, total: 0 },
        });
      } else if (++initialAttempts <= 3) {
        await route.fulfill({
          status: 503,
          json: { detail: 'private startup diagnostics' },
        });
      } else {
        await route.fulfill({
          json: { items: [lake], page: 1, page_size: 20, total: 1 },
        });
      }
    } else if (url.pathname === `/lakes/${lake.id}`) {
      await route.fulfill({ json: lake });
    } else if (url.pathname === `/lakes/${lake.id}/stations`) {
      await route.fulfill({ json: [] });
    } else {
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.goto('/catalog');
  await expect(page.getByText(/Esperando respuesta de la API/)).toBeVisible({
    timeout: 15_000,
  });
  const retry = page.getByRole('button', { name: 'Reintentar', exact: true });
  await expect(retry).toBeVisible({ timeout: 10_000 });
  expect(initialAttempts).toBe(3);
  await expect(page.getByText('private startup diagnostics')).toHaveCount(0);
  await retry.focus();
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter');
  const lakeButton = page.getByRole('button', {
    name: 'Ver detalle de Lago Panguipulli, Los Ríos',
  });
  await expect(lakeButton).toBeVisible();
  expect(initialAttempts).toBe(4);
  await page
    .getByLabel('Nombre del lago', { exact: true })
    .fill('Sin coincidencias');
  await page
    .getByRole('button', { name: 'Aplicar filtros', exact: true })
    .click();
  await expect(
    page.getByText(/No encontramos lagos para los filtros/),
  ).toBeVisible();
  await expect(lakeButton).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await lakeButton.click();
  await expect(page).toHaveURL(new RegExp(`/lakes/${lake.id}$`));
  await expect(
    page.getByRole('heading', { name: 'Lago Panguipulli', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Región: Los Ríos', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'No hay estaciones de monitoreo registradas para Lago Panguipulli.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('panguipulli-sin-estaciones.png'),
  });
});
