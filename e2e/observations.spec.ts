import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const id = '11111111-1111-4111-8111-111111111111';
const lake = {
  id,
  name: 'Lago Panguipulli (demostración)',
  region: 'Los Ríos',
  status: 'active',
  description: 'Ejemplo para probar navegación local',
  geom: {},
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

test('lake to authenticated observation, validation, local save and recovery', async ({
  page,
}, testInfo) => {
  await page.route('https://auth.aquabloom.invalid/**', async (route) => {
    if (route.request().url().includes('/token?grant_type=password')) {
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
    } else
      await route.fulfill({
        status: 404,
        json: { error: 'Unexpected auth request' },
      });
  });
  const writes: string[] = [];
  await page.route('https://api.aquabloom.invalid/**', async (route) => {
    if (route.request().method() !== 'GET') writes.push(route.request().url());
    const path = new URL(route.request().url()).pathname;
    if (path === `/lakes/${id}`) await route.fulfill({ json: lake });
    else if (path === `/lakes/${id}/stations`)
      await route.fulfill({ json: [] });
    else await route.fulfill({ json: { status: 'ok' } });
  });
  await page.goto(`/lakes/${id}`);
  await page
    .getByRole('button', { name: 'Observaciones de terreno', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?returnTo=/);
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('franco@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('fixture-password');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/lakes/${id}/observations$`));
  await expect(
    page.getByLabel(`Lago seleccionado: ${lake.name}`, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Finalizar observación', exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel('Fecha y hora de la observación', { exact: true })
    .fill('2026-02-30 12:00');
  await page
    .getByRole('button', { name: 'Guardar borrador local', exact: true })
    .click();
  await expect(
    page.getByText('Ingresa una fecha real con formato AAAA-MM-DD HH:mm.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Fecha y hora de la observación', { exact: true }),
  ).toBeFocused();
  await page
    .getByLabel('Fecha y hora de la observación', { exact: true })
    .fill('2026-10-07 14:30');
  await page
    .getByLabel('Fecha y hora de la observación', { exact: true })
    .press('Enter');
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('textbox', { name: 'Nota de terreno', exact: true })
    .fill('Nota de demostración guardada localmente');
  await page
    .getByRole('button', { name: 'Tomar fotografía', exact: true })
    .click();
  await expect(
    page.getByText(
      'La captura de cámara y ubicación está disponible en Android/iOS. En web puedes editar el borrador de texto.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toHaveValue('Nota de demostración guardada localmente');
  await page
    .getByRole('button', { name: 'Capturar ubicación', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Finalizar observación', exact: true }),
  ).toBeDisabled();
  await page.context().setOffline(true);
  await expect(page.getByText('Sin conexión', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Guardar borrador local', exact: true })
    .click();
  await expect(
    page
      .getByText('Guardado local · Pendiente de envío', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Sin envío al servidor · No validado', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Captura incompleta · Faltan fotografía disponible y ubicación.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.context().setOffline(false);
  await expect(page.getByText('Sin conexión', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Guardado local · Pendiente de envío', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toHaveValue('Nota de demostración guardada localmente');
  expect(writes).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath('observation-saved.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Volver al lago', exact: true }).click();
  await page
    .getByRole('button', { name: 'Observaciones de terreno', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toHaveValue('Nota de demostración guardada localmente');
  await expect(
    page
      .getByText(/Vista web: guardado sólo durante esta sesión/)
      .filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Nuevo borrador', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Nota de terreno', exact: true })
    .fill('Segundo borrador independiente');
  await page
    .getByRole('button', { name: 'Guardar borrador local', exact: true })
    .click();
  await expect(
    page
      .getByText('Guardado local · Pendiente de envío', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ver borradores guardados', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /Abrir borrador del/ }),
  ).toHaveCount(2);
  await page
    .getByRole('button', {
      name: /Abrir borrador del.*Nota de demostración guardada localmente/,
    })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toHaveValue('Nota de demostración guardada localmente');
  await page
    .getByRole('textbox', { name: 'Nota de terreno', exact: true })
    .fill('Primera nota editada');
  await page
    .getByRole('button', { name: 'Guardar borrador local', exact: true })
    .click();
  await expect(
    page
      .getByText('Guardado local · Pendiente de envío', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ver borradores guardados', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /Abrir borrador del/ }),
  ).toHaveCount(2);
  await page
    .getByRole('button', { name: /Abrir borrador del.*Primera nota editada/ })
    .click();
  await page
    .getByRole('button', { name: 'Eliminar borrador', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Conservar borrador', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toHaveValue('Primera nota editada');
  await page
    .getByRole('button', { name: 'Eliminar borrador', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Confirmar eliminación', exact: true })
    .click();
  await expect(
    page.getByText('Borrador y fotografías locales eliminados.', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ver borradores guardados', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /Abrir borrador del/ }),
  ).toHaveCount(1);
  await page
    .getByRole('button', {
      name: /Abrir borrador del.*Segundo borrador independiente/,
    })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Nota de terreno', exact: true }),
  ).toHaveValue('Segundo borrador independiente');
  await page.screenshot({
    path: testInfo.outputPath('drafts-recovered.png'),
    fullPage: true,
  });
  expect(writes).toEqual([]);
});
