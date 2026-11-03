import { OfflineNotice } from '../offline/OfflineNotice';
import { Link } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AsyncState } from '../../components/AsyncState';
import { isCatalogId } from '../lakes/catalogSchemas';
import { useEstimates } from './useScientific';
import { scientificSource } from './scientificSource';
import { ScientificNotice } from './ScientificNotice';
import { scientificError } from './scientificPresentation';
import { EstimateDetail } from './EstimateDetail';

export function EstimateScreen({
  lakeId,
  estimateId,
  demo,
}: {
  lakeId: string;
  estimateId: string;
  demo?: string;
}) {
  const source = scientificSource(demo);
  const query = useEstimates(isCatalogId(estimateId) ? lakeId : '', source);
  const estimate = query.data?.items.find(
    (item) => item.id.toLowerCase() === estimateId.toLowerCase(),
  );
  return (
    <Screen title="Detalle trazable de estimación">
      <ScientificNotice source={source} />
      {query.savedAt !== undefined && !query.isError ? (
        <OfflineNotice savedAt={query.savedAt} />
      ) : null}
      {!isCatalogId(lakeId) || !isCatalogId(estimateId) ? (
        <AsyncState
          kind="error"
          message="El enlace de estimación no es válido."
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
        <AsyncState kind="loading" message="Cargando estimación…" />
      ) : estimate ? (
        <EstimateDetail estimate={estimate} />
      ) : (
        <AsyncState
          kind="empty"
          message="La estimación no pertenece a este lago o ya no está disponible."
        />
      )}
      <Link
        href={{
          pathname: '/lakes/[id]/estimates',
          params: { id: lakeId, ...(source === 'demo' ? { demo: '1' } : {}) },
        }}
      >
        Volver a estimaciones del lago
      </Link>
    </Screen>
  );
}
