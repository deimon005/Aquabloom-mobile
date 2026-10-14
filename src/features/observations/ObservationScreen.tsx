import { useEffect, useRef, useState } from 'react';
import { Link } from 'expo-router';
import { Screen } from '../../components/Screen';
import { AsyncState } from '../../components/AsyncState';
import { env } from '../../config/env';
import { useCurrentUser } from '../auth/useCurrentUser';
import { isCatalogId } from '../lakes/catalogSchemas';
import { catalogError } from '../lakes/catalogError';
import { useLakeDetail } from '../lakes/useLakeDetail';
import { lakeFeature } from '../map/geometry';
import { OfflineNotice } from '../offline/OfflineNotice';
import { ObservationForm } from './ObservationForm';
import { observationStore } from './observationStore';
import { photoPersistence } from './photoPersistence';
import { saveObservation } from './saveObservation';
import {
  storedObservationSchema,
  type ObservationValues,
  type StoredObservation,
} from './observationSchema';

// Local identifiers are not credentials. The repository keeps updates on this UUID.
function draftId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const random = Math.floor(Math.random() * 16);
    return (value === 'x' ? random : (random & 3) | 8).toString(16);
  });
}

export function ObservationScreen({ lakeId }: { lakeId: string }) {
  const { user } = useCurrentUser();
  const ownerId = user?.id;
  const lake = useLakeDetail(lakeId);
  const apiScope = env.apiUrl ?? '';
  const [attempt, setAttempt] = useState(0);
  const [local, setLocal] = useState<{
    context: string;
    initial: StoredObservation | null;
    error: boolean;
  } | null>(null);
  const id = useRef<string | null>(null);
  const context = JSON.stringify([apiScope, user?.id, lakeId]);
  useEffect(() => {
    let active = true;
    id.current = null;
    if (!ownerId || !isCatalogId(lakeId)) return;
    void observationStore
      .latest(apiScope, ownerId, lakeId)
      .then((initial) => {
        if (!active) return;
        id.current = initial?.id ?? draftId();
        setLocal({ context, initial, error: false });
      })
      .catch(() => {
        if (active) setLocal({ context, initial: null, error: true });
      });
    return () => {
      active = false;
      id.current = null;
    };
  }, [apiScope, ownerId, lakeId, context, attempt]);

  async function save(values: ObservationValues) {
    if (!user || !id.current || values.lakeId !== lakeId)
      throw new Error('Contexto de borrador no disponible.');
    const record = storedObservationSchema.parse({
      version: 1,
      id: id.current,
      ownerId: user.id,
      apiScope,
      values,
      savedAt: new Date().toISOString(),
      status: 'pending_send',
    });
    return saveObservation(
      record,
      observationStore,
      photoPersistence,
      () => id.current === record.id,
    );
  }

  return (
    <Screen title="Observaciones de terreno">
      {!isCatalogId(lakeId) ? (
        <AsyncState kind="error" message="El enlace del lago no es válido." />
      ) : !user ? (
        <AsyncState
          kind="empty"
          message="Inicia sesión para crear o recuperar tus borradores."
        />
      ) : lake.isError ? (
        <AsyncState
          kind="error"
          message={catalogError(lake.error, 'el lago')}
          onRetry={() => void lake.refetch()}
        />
      ) : lake.isPending || local?.context !== context ? (
        <AsyncState kind="loading" message="Preparando observación…" />
      ) : local.error ? (
        <AsyncState
          kind="error"
          message="No pudimos recuperar tu borrador. Reintenta para evitar sobrescribir lo guardado."
          onRetry={() => {
            setLocal(null);
            setAttempt((value) => value + 1);
          }}
        />
      ) : lake.data ? (
        <>
          {lake.isOffline ? <OfflineNotice savedAt={lake.savedAt} /> : null}
          <ObservationForm
            key={context}
            lakeId={lakeId}
            lakeName={lake.data.name}
            lakeFeature={lakeFeature(lake.data)}
            initial={local.initial}
            durability={observationStore.durability}
            onSave={save}
          />
        </>
      ) : null}
      {isCatalogId(lakeId) ? (
        <Link href={{ pathname: '/lakes/[id]', params: { id: lakeId } }}>
          Volver al lago
        </Link>
      ) : (
        <Link href="/catalog">Volver al catálogo</Link>
      )}
    </Screen>
  );
}
