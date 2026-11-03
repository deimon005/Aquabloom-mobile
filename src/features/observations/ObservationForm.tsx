import { useEffect, useId, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { tokens } from '../../theme/tokens';
import { LakeMap } from '../map/LakeMap';
import type { LakeFeature } from '../map/geometry';
import { DraftStatus } from './DraftStatus';
import { PhotoPreview } from './PhotoPreview';
import { captureServices } from './captureServices';
import {
  CaptureError,
  captureMessage,
  type CaptureServices,
} from './captureTypes';
import {
  formatObservationDate,
  observationDraftSchema,
  completeObservationSchema,
  parseObservationDate,
  type ObservationValues,
  type StoredObservation,
} from './observationSchema';

export type DraftPhase = 'editing' | 'saving' | 'saved';
type Props = {
  lakeId: string;
  lakeName: string;
  lakeFeature?: LakeFeature | null;
  initial?: StoredObservation | null;
  durability: 'device' | 'session';
  onSave: (values: ObservationValues) => Promise<StoredObservation>;
  capture?: CaptureServices;
  disabled?: boolean;
};

export function ObservationForm({
  lakeId,
  lakeName,
  lakeFeature,
  initial,
  durability,
  onSave,
  capture = captureServices,
  disabled = false,
}: Props) {
  const fieldId = useId();
  const dateLabelId = `observation-date-${fieldId}`;
  const noteLabelId = `observation-note-${fieldId}`;
  const [dateText, setDateText] = useState(() =>
    formatObservationDate(
      initial ? new Date(initial.values.observedAt) : new Date(),
    ),
  );
  const [note, setNote] = useState(initial?.values.note ?? '');
  const [photoUri, setPhotoUri] = useState(initial?.values.photoUri ?? null);
  const [unavailablePhotoUri, setUnavailablePhotoUri] = useState<string | null>(
    null,
  );
  const [location, setLocation] = useState(initial?.values.location ?? null);
  const [capturing, setCapturing] = useState<'photo' | 'location' | null>(null);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [phase, setPhase] = useState<DraftPhase>(initial ? 'saved' : 'editing');
  const [savedAt, setSavedAt] = useState(initial?.savedAt ?? null);
  const [errors, setErrors] = useState<{
    date?: string;
    note?: string;
    save?: string;
  }>({});
  const pending = useRef(false);
  const isSaving = phase === 'saving';
  const busy = disabled || isSaving || capturing !== null;

  async function captureField(kind: 'photo' | 'location') {
    if (pending.current || disabled) return;
    pending.current = true;
    setCapturing(kind);
    setCaptureNotice(null);
    try {
      if (kind === 'photo') {
        const permission = await capture.cameraPermission();
        if (!active.current) return;
        if (!permission.granted)
          throw new CaptureError(
            permission.canAskAgain ? 'denied' : 'settings',
            permission.canAskAgain
              ? 'Cámara denegada. Puedes reintentar o continuar con el borrador sin foto.'
              : 'Habilita la cámara de AquaBloom en Ajustes para tomar una fotografía. Tus datos siguen aquí.',
          );
        const photo = await capture.takePhoto();
        if (!active.current) return;
        if (!photo) {
          setCaptureNotice(
            'Captura cancelada. Conservamos la fotografía anterior y los demás campos.',
          );
          return;
        }
        setPhotoUri(photo.uri);
        setUnavailablePhotoUri(null);
      } else {
        const position = await capture.captureLocation();
        if (!active.current) return;
        setLocation(position);
      }
      setPhase('editing');
      setErrors({});
    } catch (error) {
      if (active.current) setCaptureNotice(captureMessage(error));
    } finally {
      pending.current = false;
      if (active.current) setCapturing(null);
    }
  }

  async function save(complete = false) {
    if (pending.current || disabled) return;
    const observedAt = parseObservationDate(dateText);
    const result = (
      complete ? completeObservationSchema : observationDraftSchema
    ).safeParse({
      lakeId,
      observedAt: observedAt ?? '',
      note,
      location,
      photoUri,
    });
    if (!result.success) {
      setErrors({
        date: observedAt
          ? undefined
          : 'Ingresa una fecha real con formato AAAA-MM-DD HH:mm.',
        note:
          note.trim().length > 2000
            ? 'La nota admite hasta 2000 caracteres.'
            : undefined,
        save: result.error.issues.some(
          (issue) => !['note', 'observedAt'].includes(String(issue.path[0])),
        )
          ? 'Revisa el lago y los campos de captura del borrador.'
          : undefined,
      });
      return;
    }
    pending.current = true;
    setErrors({});
    setPhase('saving');
    try {
      const stored = await onSave(result.data);
      if (!active.current) return;
      setSavedAt(stored.savedAt);
      setNote(stored.values.note);
      setPhotoUri(stored.values.photoUri);
      setPhase('saved');
    } catch {
      if (!active.current) return;
      setErrors({
        save: 'No pudimos guardar el borrador. Tus cambios siguen aquí; vuelve a intentarlo.',
      });
      setPhase('editing');
    } finally {
      pending.current = false;
    }
  }

  return (
    <View style={styles.form}>
      <Text accessibilityRole="header" style={styles.heading}>
        Observación de terreno
      </Text>
      <Text style={styles.label}>Lago seleccionado</Text>
      <Text
        accessibilityLabel={`Lago seleccionado: ${lakeName}`}
        style={styles.lake}
      >
        {lakeName}
      </Text>
      <Text style={styles.muted}>
        Borrador local · Pendiente de envío y validación. Una observación o
        fotografía no constituye una medición validada.
      </Text>
      <DraftStatus phase={phase} savedAt={savedAt} durability={durability} />
      {!location || !photoUri || unavailablePhotoUri === photoUri ? (
        <Text accessibilityLiveRegion="polite" style={styles.muted}>
          Borrador incompleto: falta fotografía disponible y/o ubicación. No es
          una captura finalizada.
        </Text>
      ) : null}
      <View style={styles.field}>
        <Text nativeID={dateLabelId} style={styles.label}>
          Fecha y hora de la observación
        </Text>
        <TextInput
          accessibilityLabel="Fecha y hora de la observación"
          accessibilityLabelledBy={dateLabelId}
          aria-invalid={Boolean(errors.date)}
          accessibilityState={{ disabled: busy }}
          editable={!busy}
          autoCorrect={false}
          returnKeyType="done"
          placeholder="AAAA-MM-DD HH:mm"
          value={dateText}
          onChangeText={(value) => {
            setDateText(value);
            setPhase('editing');
            setErrors({});
          }}
          style={[styles.input, errors.date && styles.invalid]}
        />
        <Text style={styles.muted}>
          Hora local del dispositivo; se conserva como fecha UTC al guardar.
        </Text>
        {errors.date ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {errors.date}
          </Text>
        ) : null}
      </View>
      <View style={styles.field}>
        <Text nativeID={noteLabelId} style={styles.label}>
          Nota de terreno
        </Text>
        <Text style={styles.muted}>Opcional; hasta 2000 caracteres.</Text>
        <TextInput
          accessibilityLabel="Nota de terreno"
          accessibilityLabelledBy={noteLabelId}
          aria-invalid={Boolean(errors.note)}
          accessibilityState={{ disabled: busy }}
          editable={!busy}
          multiline
          textAlignVertical="top"
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setPhase('editing');
            setErrors({});
          }}
          style={[styles.input, styles.note, errors.note && styles.invalid]}
        />
        <Text style={styles.muted}>{note.length} / 2000 caracteres</Text>
        {errors.note ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {errors.note}
          </Text>
        ) : null}
      </View>
      <View style={styles.reserved}>
        <Text accessibilityRole="header" style={styles.label}>
          Ubicación de terreno
        </Text>
        <Text style={styles.muted}>
          Capturamos tu posición sólo al pulsar esta acción, para asociarla al
          lago. Puedes guardar un borrador incompleto si no autorizas la
          ubicación.
        </Text>
        {location ? (
          <>
            <Text style={styles.muted}>
              Latitud: {location.latitude.toFixed(6)} · Longitud:{' '}
              {location.longitude.toFixed(6)} · Precisión:{' '}
              {location.accuracy.toFixed(1)} m
            </Text>
            <Text style={styles.muted}>
              Punto azul: posición capturada. Contorno turquesa: lago
              seleccionado.
            </Text>
            <View
              style={styles.locationMap}
              accessibilityLabel="Mapa de posición capturada y lago seleccionado"
            >
              <LakeMap feature={lakeFeature} observationLocation={location} />
            </View>
          </>
        ) : (
          <Text style={styles.muted}>Sin ubicación capturada.</Text>
        )}
        <AppButton
          disabled={busy}
          variant="secondary"
          onPress={() => void captureField('location')}
        >
          {location ? 'Actualizar ubicación' : 'Capturar ubicación'}
        </AppButton>
      </View>
      <PhotoPreview
        uri={photoUri}
        busy={busy}
        onCapture={() => void captureField('photo')}
        onUnavailable={setUnavailablePhotoUri}
      />
      {capturing ? (
        <Text accessibilityLiveRegion="polite" style={styles.muted}>
          {capturing === 'photo'
            ? 'Capturando fotografía…'
            : 'Capturando ubicación…'}
        </Text>
      ) : null}
      {captureNotice ? (
        <Text accessibilityRole="alert" style={styles.muted}>
          {captureNotice}
        </Text>
      ) : null}
      {errors.save ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.save}
        </Text>
      ) : null}
      <AppButton
        disabled={busy || phase === 'saved'}
        accessibilityHint="Conserva un borrador local incompleto sin enviarlo al servidor"
        onPress={() => void save()}
      >
        {isSaving ? 'Guardando…' : 'Guardar borrador local'}
      </AppButton>
      <AppButton
        disabled={
          busy ||
          phase === 'saved' ||
          !location ||
          !photoUri ||
          unavailablePhotoUri === photoUri
        }
        variant="secondary"
        onPress={() => void save(true)}
      >
        Finalizar observación
      </AppButton>
      <Text style={styles.muted}>
        {location && photoUri
          ? 'La captura completa se guarda como borrador local pendiente de envío y validación.'
          : 'Para finalizar faltan ubicación y fotografía. El guardado local no envía ni valida datos.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: tokens.spacing.md },
  field: { gap: tokens.spacing.sm },
  heading: { color: tokens.colors.text, fontSize: 20, fontWeight: '700' },
  label: { color: tokens.colors.text, fontWeight: '600', fontSize: 16 },
  lake: { color: tokens.colors.primary, fontSize: 18, fontWeight: '700' },
  muted: { color: tokens.colors.muted, lineHeight: 22 },
  input: {
    minHeight: 48,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.text,
    fontSize: 16,
  },
  note: { minHeight: 112, textAlignVertical: 'top' },
  invalid: { borderColor: tokens.colors.error },
  error: { color: tokens.colors.error },
  reserved: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  locationMap: { height: 240, overflow: 'hidden', borderRadius: tokens.radius },
});
