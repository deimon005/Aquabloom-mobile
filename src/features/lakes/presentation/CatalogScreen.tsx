import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { AsyncState } from '../../../components/AsyncState';
import { Screen } from '../../../components/Screen';
import { resolveResponsiveLayout } from '../../../theme/responsive';
import { tokens } from '../../../theme/tokens';
import { LakeCard } from './LakeCard';
import type { LakeFilters } from '../domain/types';
import { useLakes } from '../application/useLakes';
import { OfflineNotice } from '../../offline/presentation/OfflineNotice';
import { catalogError } from './catalogError';
import { isCatalogStartupError } from '../application/catalogRecovery';

const initialFilters: LakeFilters = { page: 1, page_size: 20 };

function readableCatalogError(error: unknown) {
  if (error instanceof Error && error.message.includes('EXPO_PUBLIC_API_URL')) {
    return error.message;
  }
  if (isCatalogStartupError(error)) {
    return 'La API no respondió a tiempo o sigue iniciando. Puedes reintentar sin cerrar la aplicación.';
  }
  return catalogError(error, 'el catálogo');
}

export function CatalogScreen() {
  const { fontScale, width } = useWindowDimensions();
  const layout = resolveResponsiveLayout(width, fontScale);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [filters, setFilters] = useState<LakeFilters>(initialFilters);
  const lakes = useLakes(filters);

  const applyFilters = () => {
    setFilters({
      search,
      region,
      page: 1,
      page_size: initialFilters.page_size,
    });
  };
  const clearFilters = () => {
    setSearch('');
    setRegion('');
    setFilters(initialFilters);
  };
  const hasFilters = Boolean(filters.search?.trim() || filters.region?.trim());

  return (
    <Screen title="Catálogo de lagos">
      <View
        accessibilityRole="search"
        style={[styles.filters, layout.isCompact && styles.compactFilters]}
      >
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Buscar en el catálogo
        </Text>
        <TextInput
          accessibilityLabel="Nombre del lago"
          accessibilityHint="Filtra el catálogo por nombre"
          autoCapitalize="words"
          onChangeText={setSearch}
          onSubmitEditing={applyFilters}
          placeholder="Ej. Villarrica"
          returnKeyType="search"
          style={styles.input}
          value={search}
        />
        <TextInput
          accessibilityLabel="Región"
          accessibilityHint="Filtra el catálogo por región"
          autoCapitalize="words"
          onChangeText={setRegion}
          onSubmitEditing={applyFilters}
          placeholder="Ej. La Araucanía"
          returnKeyType="search"
          style={styles.input}
          value={region}
        />
        <View style={[styles.actions, layout.stackActions && styles.stack]}>
          <AppButton
            onPress={applyFilters}
            style={layout.stackActions && styles.fullWidth}
          >
            Aplicar filtros
          </AppButton>
          {hasFilters ? (
            <AppButton
              onPress={clearFilters}
              style={layout.stackActions && styles.fullWidth}
              variant="secondary"
            >
              Limpiar
            </AppButton>
          ) : null}
        </View>
      </View>

      {lakes.isOffline && !lakes.isError && !lakes.isPlaceholderData ? (
        <OfflineNotice savedAt={lakes.savedAt} />
      ) : null}
      {lakes.isPending || lakes.isPlaceholderData ? (
        <AsyncState
          kind="loading"
          message={
            isCatalogStartupError(lakes.failureReason)
              ? 'Esperando respuesta de la API. Estamos reintentando el catálogo…'
              : lakes.isPlaceholderData
                ? 'Buscando lagos con los nuevos filtros…'
                : 'Cargando catálogo de lagos…'
          }
        />
      ) : lakes.isError ? (
        <AsyncState
          kind="error"
          message={readableCatalogError(lakes.error)}
          retrying={lakes.isFetching}
          onRetry={() => void lakes.refetch({ cancelRefetch: false })}
        />
      ) : !lakes.data || lakes.data.items.length === 0 ? (
        <AsyncState
          kind="empty"
          message={
            hasFilters
              ? 'No encontramos lagos para los filtros seleccionados. Puedes limpiarlos y volver a buscar.'
              : 'No hay lagos disponibles en el catálogo.'
          }
        />
      ) : (
        <View style={styles.results}>
          <View style={styles.resultsHeading} accessibilityLiveRegion="polite">
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {lakes.data.total} {lakes.data.total === 1 ? 'lago' : 'lagos'}
            </Text>
            {lakes.isFetching ? (
              <ActivityIndicator
                accessibilityLabel="Actualizando catálogo"
                color={tokens.colors.primary}
                size="small"
              />
            ) : null}
          </View>
          {lakes.data.items.map((lake) => (
            <LakeCard
              key={lake.id}
              lake={lake}
              style={layout.columns === 2 ? styles.wideCard : styles.singleCard}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.surface,
  },
  compactFilters: { padding: tokens.spacing.sm },
  sectionTitle: {
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
    backgroundColor: tokens.colors.background,
    color: tokens.colors.text,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  stack: { flexDirection: 'column' },
  fullWidth: { width: '100%' },
  results: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  resultsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  singleCard: { width: '100%' },
  wideCard: { flexBasis: '47%', flexGrow: 1, minWidth: 280 },
});
