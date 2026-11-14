import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { tokens } from '../../theme/tokens';

export function PhotoPreview({
  uri,
  busy,
  onCapture,
  onUnavailable,
  children,
}: {
  uri: string | null;
  busy: boolean;
  onCapture: () => void;
  onUnavailable: (uri: string) => void;
  children?: ReactNode;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.label}>
        Fotografía de la observación
      </Text>
      <Text style={styles.text}>
        Usamos la cámara para adjuntar una foto de terreno al borrador local.
        Puedes cancelar o reemplazarla; la foto no se envía al servidor.
      </Text>
      {uri ? (
        <>
          <Image
            accessibilityLabel="Vista previa de la fotografía de terreno"
            source={{ uri }}
            resizeMode="contain"
            onError={() => {
              setFailedUri(uri);
              onUnavailable(uri);
            }}
            style={styles.image}
          />
          {failedUri === uri ? (
            <Text accessibilityRole="alert" style={styles.error}>
              La fotografía no está disponible para vista previa. Reemplázala
              antes de completar la observación.
            </Text>
          ) : (
            <Text style={styles.text}>
              Una fotografía seleccionada. Al reemplazarla conservamos la
              anterior si cancelas.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.text}>Todavía no hay una fotografía.</Text>
      )}
      <AppButton
        disabled={busy}
        variant="secondary"
        accessibilityHint="Solicita permiso de cámara en contexto y captura una sola fotografía"
        onPress={onCapture}
      >
        {uri ? 'Reemplazar fotografía' : 'Tomar fotografía'}
      </AppButton>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: tokens.spacing.sm },
  label: { color: tokens.colors.text, fontSize: 16, fontWeight: '600' },
  text: { color: tokens.colors.muted, lineHeight: 22 },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius,
  },
  error: { color: tokens.colors.error },
});
