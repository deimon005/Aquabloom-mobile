import { useEffect, useRef, useState } from 'react';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { AsyncState } from '../../../components/AsyncState';
import { env } from '../../../config/env';
import { useCurrentUser } from '../../auth/application/useCurrentUser';
import { isCatalogId } from '../../../domain/catalogId';
import { catalogError } from '../../lakes/presentation/catalogError';
import { useLakeDetail } from '../../lakes/application/useLakeDetail';
import { lakeFeature } from '../../map/domain/geometry';
import { OfflineNotice } from '../../offline/presentation/OfflineNotice';
import { ObservationForm } from './ObservationForm';
import { observationStore } from '../data/observationStore';
import { photoPersistence } from '../data/photoPersistence';
import { saveObservation } from '../application/saveObservation';
import { deleteObservation } from '../application/deleteObservation';
import {
  storedObservationSchema,
  type ObservationValues,
  type StoredObservation,
} from '../domain/observationSchema';

// Local identifiers are not credentials. The repository keeps updates on this UUID.
function draftId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const random = Math.floor(Math.random() * 16);
    return (value === 'x' ? random : (random & 3) | 8).toString(16);
  });
}

export function ObservationScreen({ lakeId }: { lakeId: string }) {
  const { user } = useCurrentUser();
  return (
    <ObservationEditor
      key={JSON.stringify([env.apiUrl, user?.id, lakeId])}
      lakeId={lakeId}
    />
  );
}

function ObservationEditor({ lakeId }: { lakeId: string }) {
  const { user } = useCurrentUser();
  const ownerId = user?.id;
  const lake = useLakeDetail(lakeId);
  const apiScope = env.apiUrl ?? '';
  const [attempt, setAttempt] = useState(0);
  const [editor, setEditor] = useState(0);
  const [recoveredContext, setRecoveredContext] = useState<string | null>(null);
  const [knownLakeName, setKnownLakeName] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<{
    context: string;
    records: StoredObservation[];
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const currentContext = useRef('');
  const [local, setLocal] = useState<{
    context: string;
    initial: StoredObservation | null;
    error: boolean;
  } | null>(null);
  const id = useRef<string | null>(null);
  const context = JSON.stringify([apiScope, user?.id, lakeId]);
  const liveLakeName = lake.data?.name;
  // This editor is keyed by account, API and lake. Retain the last verified
  // name so a transient refetch cannot unmount an active form.
  if (liveLakeName && liveLakeName !== knownLakeName) {
    setKnownLakeName(liveLakeName);
  }
  const lakeName = liveLakeName ?? knownLakeName;
  const canKeepEditor = Boolean(
    lakeName || local?.initial || recoveredContext === context,
  );
  useEffect(() => {
    currentContext.current = context;
    return () => {
      currentContext.current = '';
    };
  }, [context]);
  useEffect(() => {
    let active = true;
    id.current = null;
    if (!ownerId || !isCatalogId(lakeId)) return;
    void observationStore
      .latest(apiScope, ownerId, lakeId)
      .then((initial) => {
        if (!active) return;
        id.current = initial?.id ?? draftId();
        if (initial) setRecoveredContext(context);
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
    if (operation.current) throw new Error('Hay una operación local en curso.');
    operation.current = true;
    setBusy(true);
    try {
      const stored = await saveObservation(
        record,
        observationStore,
        photoPersistence,
        () => id.current === record.id && currentContext.current === context,
      );
      if (currentContext.current === context) {
        setLocal({ context, initial: stored, error: false });
        setDrafts(null);
        setNotice(null);
      }
      return stored;
    } finally {
      operation.current = false;
      if (currentContext.current === context) setBusy(false);
    }
  }

  function selectDraft(record: StoredObservation | null) {
    if (operation.current) return;
    id.current = record?.id ?? draftId();
    setLocal({ context, initial: record, error: false });
    setEditor((value) => value + 1);
    setDrafts(null);
    setNotice(null);
    setConfirmDelete(false);
  }

  async function showDrafts() {
    if (!ownerId || operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      const records = await observationStore.list(apiScope, ownerId, lakeId);
      if (currentContext.current === context) {
        setDrafts({ context, records });
        setNotice(null);
      }
    } catch {
      if (currentContext.current === context)
        setNotice(
          'No pudimos listar tus borradores. Puedes reintentar sin perder lo guardado.',
        );
    } finally {
      operation.current = false;
      if (currentContext.current === context) setBusy(false);
    }
  }

  async function removeDraft() {
    const record = local?.initial;
    if (
      !record ||
      !ownerId ||
      operation.current ||
      currentContext.current !== context
    )
      return;
    operation.current = true;
    setBusy(true);
    try {
      await deleteObservation(
        { apiScope, ownerId, draftId: record.id },
        observationStore,
        photoPersistence,
      );
      if (currentContext.current === context) {
        operation.current = false;
        selectDraft(null);
        setNotice('Borrador y fotografías locales eliminados.');
      }
    } catch {
      if (currentContext.current === context)
        setNotice(
          'No pudimos terminar de eliminar el borrador. Reintenta; si falta la foto puedes reemplazarla y conservar los campos.',
        );
    } finally {
      operation.current = false;
      if (currentContext.current === context) setBusy(false);
    }
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
      ) : lake.isError && !canKeepEditor && local?.context === context ? (
        <AsyncState
          kind="error"
          message={catalogError(lake.error, 'el lago')}
          onRetry={() => void lake.refetch()}
        />
      ) : local?.context !== context || (lake.isPending && !canKeepEditor) ? (
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
      ) : canKeepEditor ? (
        <>
          {lake.isOffline ? <OfflineNotice savedAt={lake.savedAt} /> : null}
          {!lake.data || lake.isError ? (
            <Text accessibilityLiveRegion="polite">
              {lakeName
                ? 'El catálogo del lago no está disponible. Puedes continuar editando tu borrador.'
                : 'Recuperado del dispositivo. El catálogo del lago no está disponible; puedes editar tu borrador.'}
            </Text>
          ) : null}
          <Text>
            Guarda tus cambios antes de abrir otro borrador o crear uno nuevo.
          </Text>
          <AppButton
            disabled={busy}
            variant="secondary"
            onPress={() => void showDrafts()}
          >
            Ver borradores guardados
          </AppButton>
          {drafts?.context === context ? (
            <View>
              {drafts.records.length === 0 ? (
                <Text>No tienes borradores guardados en este lago.</Text>
              ) : (
                drafts.records.map((record) => (
                  <AppButton
                    key={record.id}
                    disabled={busy}
                    variant="secondary"
                    onPress={() => selectDraft(record)}
                  >{`Abrir borrador del ${new Date(record.savedAt).toLocaleString()}: ${record.values.note.slice(0, 80) || 'Sin nota'}`}</AppButton>
                ))
              )}
            </View>
          ) : null}
          <AppButton
            disabled={busy}
            variant="secondary"
            accessibilityHint="Abre un formulario vacío; los cambios sin guardar del formulario actual se descartan"
            onPress={() => selectDraft(null)}
          >
            Nuevo borrador
          </AppButton>
          {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}
          <ObservationForm
            key={`${context}:${editor}`}
            lakeId={lakeId}
            lakeName={lakeName ?? lakeId}
            lakeFeature={lake.data ? lakeFeature(lake.data) : null}
            initial={local.initial}
            durability={observationStore.durability}
            onSave={save}
            disabled={busy}
          />
          {local.initial ? (
            confirmDelete ? (
              <View>
                <Text accessibilityRole="alert">
                  ¿Eliminar este borrador y todas sus fotografías locales? Esta
                  acción no se puede deshacer.
                </Text>
                <AppButton disabled={busy} onPress={() => void removeDraft()}>
                  Confirmar eliminación
                </AppButton>
                <AppButton
                  disabled={busy}
                  variant="secondary"
                  onPress={() => setConfirmDelete(false)}
                >
                  Conservar borrador
                </AppButton>
              </View>
            ) : (
              <AppButton
                disabled={busy}
                variant="secondary"
                onPress={() => setConfirmDelete(true)}
              >
                Eliminar borrador
              </AppButton>
            )
          ) : null}
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
