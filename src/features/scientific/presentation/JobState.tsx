import { Text, View } from 'react-native';
import type { ScientificJob } from '../domain/job';
import { jobLabels, scientificDate } from './scientificPresentation';
import { tokens } from '../../../theme/tokens';

export function JobState({ job }: { job: ScientificJob }) {
  return (
    <View style={{ gap: tokens.spacing.md }}>
      <Text>Trabajo: {job.id}</Text>
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: tokens.colors.text, fontSize: 18 }}
      >
        Estado: {jobLabels[job.status]}
      </Text>
      <Text>Actualizado: {scientificDate(job.updated_at)}</Text>
      {typeof job.progress === 'number' ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Progreso informado por la API"
          accessibilityValue={{ min: 0, max: 100, now: job.progress }}
        >
          <Text>Progreso informado: {job.progress}%</Text>
        </View>
      ) : (
        <Text>Progreso no informado por la API.</Text>
      )}
      {job.status === 'failed' ? (
        <Text accessibilityRole="alert">
          El trabajo falló. No mostramos detalles internos; consulta al equipo
          responsable con el identificador del trabajo.
        </Text>
      ) : null}
      {job.status === 'cancelled' ? (
        <Text>
          El trabajo fue cancelado; no hay resultado nuevo confirmado.
        </Text>
      ) : null}
      {job.status === 'completed' ? (
        <Text>
          Trabajo completado no equivale a resultado científicamente validado.
        </Text>
      ) : null}
      <Text>
        Consulta de un trabajo existente. Esta pantalla no crea trabajos ni
        inicia entrenamiento.
      </Text>
    </View>
  );
}
