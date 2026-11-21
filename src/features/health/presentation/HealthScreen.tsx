import { Button, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { AsyncState } from '../../../components/AsyncState';
import { api } from '../../../infrastructure/http/api';
import { environment } from '../../../config/env';

export function HealthScreen() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => {
      if (!api) throw new Error('Configura EXPO_PUBLIC_API_URL.');
      // The real OpenAPI schema is not supplied yet; do not invent response fields.
      return api<unknown>('/health', { signal });
    },
    enabled: !!api,
  });
  return (
    <Screen title="AquaBloom Sur">
      <Text>Base de desarrollo móvil · Sprint 1</Text>
      {!environment.success ? (
        <AsyncState
          kind="error"
          message="Revisa las URL y la configuración pública de Supabase en .env.local."
        />
      ) : !api ? (
        <AsyncState
          kind="empty"
          message="Configura EXPO_PUBLIC_API_URL en .env.local para comprobar la API."
        />
      ) : health.isPaused ? (
        <AsyncState
          kind="empty"
          message="La consulta está pausada hasta recuperar la conexión."
        />
      ) : health.isPending ? (
        <AsyncState kind="loading" message="Comprobando API…" />
      ) : health.isError ? (
        <AsyncState
          kind="error"
          message={health.error.message}
          onRetry={() => void health.refetch()}
        />
      ) : (
        <>
          <Text accessibilityLiveRegion="polite">API disponible</Text>
          <Button
            title="Comprobar nuevamente"
            onPress={() => void health.refetch()}
          />
        </>
      )}
      <Text>
        Catálogo, mapa y perfil tienen rutas preparadas para el trabajo del
        equipo.
      </Text>
    </Screen>
  );
}
