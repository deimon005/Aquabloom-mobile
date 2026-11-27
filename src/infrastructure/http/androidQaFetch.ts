import { qaApiUrl, qaAuthUrl } from '../../config/androidQa';

const lake = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Panguipulli (prueba QA)',
  region: 'Los Ríos',
  status: 'active',
  description: 'Datos sintéticos para reproducir las pruebas Android.',
  geom: {},
  created_at: '2026-11-26T00:00:00Z',
  updated_at: '2026-11-26T00:00:00Z',
};
const account = {
  id: '33333333-3333-4333-8333-333333333333',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'franco@example.test',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-11-26T00:00:00Z',
};

let remainingCatalogFailures = 3;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// All responses are process-local, including unexpected destinations.
export const androidQaFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);

  if (url.origin === qaAuthUrl) {
    if (request.method === 'POST' && url.pathname === '/auth/v1/token') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const credentials = await request.json();
        if (
          credentials.email !== account.email ||
          credentials.password !== 'fixture-password'
        ) {
          return json({ message: 'Credenciales de prueba incorrectas.' }, 400);
        }
      } else if (grant !== 'refresh_token') {
        return json({ message: 'Grant de prueba desconocido.' }, 400);
      }
      return json({
        access_token: 'aquabloom-qa-token',
        refresh_token: 'aquabloom-qa-refresh',
        token_type: 'bearer',
        expires_in: 3600,
        user: account,
      });
    }
    if (request.method === 'GET' && url.pathname === '/auth/v1/user') {
      return json(account);
    }
    if (request.method === 'POST' && url.pathname === '/auth/v1/logout') {
      return new Response(null, { status: 204 });
    }
  }

  if (url.origin === qaApiUrl && request.method === 'GET') {
    if (url.pathname === '/health') return json({ status: 'ok' });
    if (url.pathname === '/lakes') {
      if (remainingCatalogFailures > 0) {
        remainingCatalogFailures--;
        return json({ message: 'Fallo transitorio de prueba.' }, 503);
      }
      return json({ items: [lake], page: 1, page_size: 20, total: 1 });
    }
    if (url.pathname === `/lakes/${lake.id}`) return json(lake);
    if (url.pathname === `/lakes/${lake.id}/stations`) return json([]);
  }

  return json({ message: 'Ruta fuera de los datos de prueba.' }, 404);
};
