import { Text, View } from 'react-native';
import type { EstimatePoint } from '../../domain/scientific/estimates';
import { metadata, scientificDate } from './scientificPresentation';
import { tokens } from '../shared/theme/tokens';

export function EstimateDetail({ estimate }: { estimate: EstimatePoint }) {
  const fields = [
    ['Resultado', estimate.id],
    ['Lago', estimate.lake_id],
    ['Punto o estación', estimate.point_id],
    ['Fecha', scientificDate(estimate.observed_at)],
    ['Variable', estimate.variable],
    ['Valor', `${estimate.value} ${estimate.unit}`],
    ['Estado informado', estimate.status],
    ['Escena de origen', metadata(estimate.scene_id)],
    ['Modelo', metadata(estimate.model_id)],
    ['Versión de modelo', metadata(estimate.model_version)],
    ['Dataset', metadata(estimate.dataset_id)],
    ['Versión de dataset', metadata(estimate.dataset_version)],
  ];
  return (
    <View style={{ gap: tokens.spacing.md }}>
      {fields.map(([label, value]) => (
        <Text key={label} style={{ color: tokens.colors.text, lineHeight: 24 }}>
          {label}: {value}
        </Text>
      ))}
      <Text style={{ color: tokens.colors.text }}>
        Origen:{' '}
        {estimate.scene_id?.trim()
          ? `Escena ${estimate.scene_id}`
          : 'No informado; falta escena de origen.'}
      </Text>
      <Text accessibilityRole="header">Advertencias y límites científicos</Text>
      <Text style={{ color: tokens.colors.text, lineHeight: 24 }}>
        Incertidumbre calibrada: no informada en el contrato disponible. No se
        calcula ni inventa un intervalo de confianza.
      </Text>
      {estimate.warnings.length ? (
        estimate.warnings.map((warning, index) => (
          <Text
            key={index}
            accessibilityRole="alert"
            style={{ color: tokens.colors.text, lineHeight: 24 }}
          >
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
