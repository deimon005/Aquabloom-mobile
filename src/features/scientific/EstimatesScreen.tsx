import { OfflineNotice } from '../offline/OfflineNotice';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/AppButton';
import { AsyncState } from '../../components/AsyncState';
import { isCatalogId } from '../lakes/catalogSchemas';
import { useEstimates } from './useScientific';
import { demoJobIds, scientificSource } from './scientificSource';
import { ScientificNotice } from './ScientificNotice';
import { scientificDate, scientificError } from './scientificPresentation';
import { tokens } from '../../theme/tokens';

export function EstimatesScreen({
  lakeId,
  demo,
}: {
  lakeId: string;
  demo?: string;
}) {
  const source = scientificSource(demo);
  const query = useEstimates(lakeId, source);
  const [jobId, setJobId] = useState('');
  const [jobError, setJobError] = useState(false);
  return (
    <Screen title="Estimaciones del lago">
      <ScientificNotice source={source} />
      {query.savedAt !== undefined && !query.isError ? (
        <OfflineNotice savedAt={query.savedAt} />
      ) : null}
      <Text>Lago: {lakeId}</Text>
      {!isCatalogId(lakeId) ? (
        <AsyncState kind="error" message="El enlace del lago no es válido." />
      ) : source === 'disabled' ? (
        <>
          <Text>
            Consulta remota deshabilitada hasta acordar contrato, rutas y
            permisos. Puedes explorar un ejemplo claramente identificado.
          </Text>
          <AppButton
            onPress={() =>
              router.push({
                pathname: '/lakes/[id]/estimates',
                params: { id: lakeId, demo: '1' },
              })
            }
          >
            Abrir demostración local
          </AppButton>
        </>
      ) : query.isError ? (
        <AsyncState
          kind="error"
          message={scientificError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending || !query.data ? (
        <AsyncState kind="loading" message="Cargando estimaciones…" />
      ) : !query.data.items.length ? (
        <AsyncState
          kind="empty"
          message="No hay estimaciones disponibles para este lago."
        />
      ) : (
        query.data.items.map((estimate) => (
          <View
            key={estimate.id}
            style={{
              gap: tokens.spacing.sm,
              paddingVertical: tokens.spacing.md,
            }}
          >
            <Text accessibilityRole="header">
              Punto o estación: {estimate.point_id}
            </Text>
            <Text>Fecha: {scientificDate(estimate.observed_at)}</Text>
            <Text>
              Valor: {estimate.value} {estimate.unit}
            </Text>
            <Text>Estado informado: {estimate.status}</Text>
            <AppButton
              accessibilityHint="Abre escena, modelo, dataset y advertencias de esta estimación"
              onPress={() =>
                router.push({
                  pathname: '/lakes/[id]/estimates/[estimateId]',
                  params: {
                    id: lakeId,
                    estimateId: estimate.id,
                    ...(source === 'demo' ? { demo: '1' } : {}),
                  },
                })
              }
            >
              Ver estimación {estimate.point_id}
            </AppButton>
          </View>
        ))
      )}
      {source !== 'disabled' && isCatalogId(lakeId) ? (
        <>
          <Text accessibilityRole="header">Consultar trabajo existente</Text>
          {source === 'demo' ? (
            <AppButton
              onPress={() =>
                router.push({
                  pathname: '/scientific/jobs/[jobId]',
                  params: { jobId: demoJobIds[1], demo: '1' },
                })
              }
            >
              Ver trabajo de demostración
            </AppButton>
          ) : (
            <>
              <TextInput
                accessibilityLabel="Identificador UUID del trabajo científico"
                placeholder="UUID del trabajo existente"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                value={jobId}
                onChangeText={(value) => {
                  setJobId(value);
                  setJobError(false);
                }}
                style={{
                  minHeight: 48,
                  borderWidth: 1,
                  padding: tokens.spacing.md,
                  color: tokens.colors.text,
                }}
              />
              {jobError ? (
                <Text accessibilityRole="alert">
                  Ingresa un UUID de trabajo válido.
                </Text>
              ) : null}
              <AppButton
                onPress={() => {
                  if (!isCatalogId(jobId.trim())) {
                    setJobError(true);
                    return;
                  }
                  router.push({
                    pathname: '/scientific/jobs/[jobId]',
                    params: { jobId: jobId.trim() },
                  });
                }}
              >
                Consultar estado de trabajo
              </AppButton>
            </>
          )}
        </>
      ) : null}
      <Link href={{ pathname: '/lakes/[id]', params: { id: lakeId } }}>
        Volver al lago
      </Link>
    </Screen>
  );
}
