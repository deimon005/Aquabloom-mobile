import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { AppButton } from '../shared/components/AppButton';
import { Screen } from '../shared/components/Screen';
import { AsyncState } from '../shared/components/AsyncState';
import { catalogError } from './catalogError';
import { isCatalogId } from '../../domain/lakes/catalogSchemas';
import { useLakeDetail } from './useLakeDetail';
import { StationsList } from './StationsList';
import { OfflineNotice } from '../offline/OfflineNotice';
import { tokens } from '../shared/theme/tokens';
import { AppIcon } from '../shared/components/AppIcon';

export function LakeDetailScreen({ id }: { id: string }) {
  const lake = useLakeDetail(id);
  return (
    <Screen
      title={
        !lake.isError
          ? (lake.data?.name ?? 'Detalle de lago')
          : 'Detalle de lago'
      }
    >
      {lake.isOffline && !lake.isError ? (
        <OfflineNotice savedAt={lake.savedAt} />
      ) : null}
      {!isCatalogId(id) ? (
        <AsyncState kind="error" message="El enlace del lago no es válido." />
      ) : lake.isPending ? (
        <AsyncState kind="loading" message="Cargando lago…" />
      ) : lake.isError ? (
        <AsyncState
          kind="error"
          message={catalogError(lake.error, 'el lago')}
          onRetry={() => void lake.refetch()}
        />
      ) : lake.data ? (
        <>
          <View style={styles.information}>
            <View style={styles.context}>
              <View style={styles.lakeIcon}>
                <AppIcon name="lake" size={28} />
              </View>
              <View style={styles.contextText}>
                <Text style={styles.region}>Región: {lake.data.region}</Text>
                <Text style={styles.status}>Estado: {lake.data.status}</Text>
              </View>
            </View>
            <Text style={styles.description}>
              {lake.data.description || 'Sin descripción disponible.'}
            </Text>
          </View>
          <AppButton
            accessibilityHint="Abre el contorno del lago, sus puntos de medición y las predicciones espaciales disponibles"
            onPress={() =>
              router.push({ pathname: '/map', params: { lakeId: id } })
            }
          >
            Ver mapa del lago
          </AppButton>
          <AppButton
            accessibilityHint="Consulta resultados, trazabilidad y límites científicos; la demostración se identifica por separado"
            onPress={() =>
              router.push({ pathname: '/lakes/[id]/estimates', params: { id } })
            }
          >
            Estimaciones científicas
          </AppButton>
          <AppButton
            variant="secondary"
            accessibilityHint="Abre un borrador de observación asociado a este lago"
            onPress={() =>
              router.push({
                pathname: '/lakes/[id]/observations',
                params: { id },
              })
            }
          >
            Observaciones de terreno
          </AppButton>
          <View style={styles.information}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Estaciones de monitoreo
            </Text>
            <StationsList lakeId={id} />
          </View>
        </>
      ) : null}
      <Link style={styles.back} href="/catalog">
        Volver al catálogo
      </Link>
    </Screen>
  );
}
const styles = StyleSheet.create({
  information: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    padding: 20,
    gap: 18,
    ...tokens.shadow,
  },
  context: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  contextText: { flex: 1, gap: 6 },
  lakeIcon: {
    width: 54,
    height: 54,
    backgroundColor: tokens.colors.primarySoft,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  region: {
    color: tokens.colors.heading,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  status: { color: tokens.colors.success, fontSize: 12 },
  description: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 23,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  sectionTitle: {
    color: tokens.colors.heading,
    fontSize: 17,
    fontWeight: '700',
  },
  back: {
    color: tokens.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    padding: 12,
  },
});
