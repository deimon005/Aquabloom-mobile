import { StyleSheet, Text, View } from 'react-native';
import type { EstimatePoint } from './estimatesApi';
import { metadata, scientificDate } from './scientificPresentation';
import { tokens } from '../../theme/tokens';

export function EstimateDetail({ estimate }: { estimate: EstimatePoint }) {
  const fields = [
    ['Resultado', estimate.id],
    ['Lago', estimate.lake_id],
    ['Punto o estación', estimate.point_id],
    ['Fecha', scientificDate(estimate.observed_at)],
    ['Variable', estimate.variable],
    ['Valor', `${estimate.value} ${estimate.unit}`],
    ['Escena de origen', metadata(estimate.scene_id)],
    ['Modelo', metadata(estimate.model_id)],
    ['Versión de modelo', metadata(estimate.model_version)],
    ['Dataset', metadata(estimate.dataset_id)],
    ['Versión de dataset', metadata(estimate.dataset_version)],
  ];
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        Resultado y unidades
      </Text>
      {fields.map(([label, value]) => (
        <Text key={label} style={styles.field}>
          {label}: {value}
        </Text>
      ))}
      <Text accessibilityRole="header" style={styles.heading}>
        Procedencia
      </Text>
      {provenance.map(([label, value]) => (
        <Text key={label} style={styles.field}>
          {label}: {value}
        </Text>
      ))}
      <Text style={styles.field}>
        Origen:{' '}
        {estimate.scene_id?.trim()
          ? `Escena ${estimate.scene_id}`
          : 'No informado; falta escena de origen.'}
      </Text>
      <Text accessibilityRole="header">Advertencias y límites científicos</Text>
      <Text style={styles.field}>
        Incertidumbre calibrada: no informada en el contrato disponible. No se
        calcula ni inventa un intervalo de confianza.
      </Text>
      {estimate.warnings.length ? (
        estimate.warnings.map((warning, index) => (
          <Text key={index} accessibilityRole="alert" style={styles.field}>
            {warning}
          </Text>
        ))
      ) : (
        <Text>
          La API no informó advertencias adicionales. Esto no acredita
          validación científica.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: tokens.spacing.md },
  heading: { color: tokens.colors.text, fontSize: 18, fontWeight: '700' },
  field: { color: tokens.colors.text, fontSize: 16 },
});
