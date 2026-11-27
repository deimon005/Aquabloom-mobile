import { useAppServices } from '../shared/services/AppServicesProvider';
import { Link, router } from 'expo-router';
import { Screen } from '../shared/components/Screen';
import { AppButton } from '../shared/components/AppButton';
import { AsyncState } from '../shared/components/AsyncState';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import { useScientificJob } from './useScientific';
import { scientificSource, demoJobIds } from '../../domain/scientific/source';
import { scientificJobStatuses } from '../../domain/scientific/jobs';
import { ScientificNotice } from './ScientificNotice';
import { scientificError, jobLabels } from './scientificPresentation';
import { JobState } from './JobState';

export function ScientificJobScreen({
  jobId,
  demo,
}: {
  jobId: string;
  demo?: string;
}) {
  const { config } = useAppServices();
  const source = scientificSource(demo, config.scientificApiEnabled);
  const query = useScientificJob(jobId, source);
  return (
    <Screen title="Estado de trabajo científico">
      <ScientificNotice source={source} />
      {!isCatalogId(jobId) ? (
        <AsyncState
          kind="error"
          message="El identificador del trabajo no es válido."
        />
      ) : source === 'disabled' ? (
        <AsyncState
          kind="empty"
          message="La consulta científica está pendiente de acuerdo con Web/API."
        />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          message={scientificError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : query.isPending ? (
        <AsyncState kind="loading" message="Cargando trabajo…" />
      ) : (
        <>
          <JobState job={query.data} />
          <AppButton
            disabled={query.isFetching}
            accessibilityHint="Consulta de nuevo el trabajo existente sin iniciarlo"
            onPress={() => void query.refetch()}
          >
            Actualizar estado del trabajo
          </AppButton>
        </>
      )}
      {source === 'demo'
        ? scientificJobStatuses.map((status, index) => (
            <AppButton
              key={status}
              variant="secondary"
              onPress={() =>
                router.replace({
                  pathname: '/scientific/jobs/[jobId]',
                  params: { jobId: demoJobIds[index], demo: '1' },
                })
              }
            >
              Ejemplo: {jobLabels[status]}
            </AppButton>
          ))
        : null}
      <Link href="/catalog">Volver al catálogo</Link>
    </Screen>
  );
}
