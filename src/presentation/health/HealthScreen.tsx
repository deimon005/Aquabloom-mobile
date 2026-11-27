import { useAppServices } from '../shared/services/AppServicesProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../shared/components/Screen';
import { AsyncState } from '../shared/components/AsyncState';
import { AppButton } from '../shared/components/AppButton';
import { AppIcon } from '../shared/components/AppIcon';
import { tokens } from '../shared/theme/tokens';

export function HealthScreen() {
  const {
    config,
    health: { configured: healthConfigured, loadHealth },
  } = useAppServices();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => loadHealth(signal),
    enabled: healthConfigured,
  });
  return (
    <Screen
      title="Panel general"
      subtitle="El conocimiento de nuestros lagos empieza con la colaboración."
    >
      <View style={styles.hero}>
        <View style={styles.heroOrbit} />
        <View style={styles.heroOrbitSmall} />
        <Text style={styles.heroEyebrow}>LAGOS DEL SUR DE CHILE</Text>
        <Text style={styles.heroTitle}>Conoce, observa{'\n'}y conecta.</Text>
        <Text style={styles.heroDescription}>
          Explora el territorio y reúne tus observaciones de terreno en un solo
          lugar.
        </Text>
      </View>
      {!config.environmentValid ? (
        <AsyncState
          kind="error"
          message="Revisa las URL y la configuración pública de Supabase en .env.local."
        />
      ) : !healthConfigured ? (
        <AsyncState
          kind="empty"
          message="Configura EXPO_PUBLIC_API_URL en .env.local para comprobar la API."
        />
      ) : health.isPaused ? (
        <AsyncState
          kind="empty"
          message="La consulta está pausada hasta recuperar la conexión."
        />
      ) : health.isPending ? (
        <AsyncState kind="loading" message="Comprobando API…" />
      ) : health.isError ? (
        <AsyncState
          kind="error"
          message={health.error.message}
          onRetry={() => void health.refetch()}
        />
      ) : (
        <View style={styles.connection}>
          <View style={styles.connectionHeading}>
            <View style={styles.connectionIcon}>
              <AppIcon name="shield" size={22} />
            </View>
            <View style={styles.connectionText}>
              <Text
                accessibilityLiveRegion="polite"
                style={styles.connectionTitle}
              >
                API disponible
              </Text>
              <Text style={styles.caption}>
                Conexión con los servicios de AquaBloom
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <AppButton variant="secondary" onPress={() => void health.refetch()}>
            Comprobar nuevamente
          </AppButton>
        </View>
      )}
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Explora el territorio</Text>
        <Text style={styles.sectionOverline}>ACCESOS RÁPIDOS</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir catálogo de lagos"
          onPress={() => router.push('/catalog')}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <View style={styles.actionIcon}>
            <AppIcon name="lake" />
          </View>
          <Text style={styles.actionTitle}>Catálogo de lagos</Text>
          <Text style={styles.caption}>
            Lagos, estaciones y contexto del territorio.
          </Text>
          <View style={styles.actionLink}>
            <Text style={styles.linkText}>Explorar</Text>
            <AppIcon name="arrow" size={17} />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mapa de lagos"
          onPress={() => router.push('/map')}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: tokens.colors.blueSoft },
            ]}
          >
            <AppIcon name="map" color={tokens.colors.blue} />
          </View>
          <Text style={styles.actionTitle}>Mapa de lagos</Text>
          <Text style={styles.caption}>
            Ubica lagos y estaciones de monitoreo.
          </Text>
          <View style={styles.actionLink}>
            <Text style={styles.linkText}>Ver mapa</Text>
            <AppIcon name="arrow" size={17} />
          </View>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/profile')}
        style={styles.contribution}
      >
        <View style={styles.contributionIcon}>
          <AppIcon name="user" />
        </View>
        <View style={styles.contributionText}>
          <Text style={styles.actionTitle}>Tu próxima observación</Text>
          <Text style={styles.caption}>
            Accede a tu cuenta y registra lo que observas en terreno.
          </Text>
        </View>
        <AppIcon name="arrow" size={20} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: tokens.colors.navy,
    padding: 24,
    borderRadius: tokens.radius,
    gap: 12,
    overflow: 'hidden',
  },
  heroEyebrow: {
    color: '#8ED5CE',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 36,
  },
  heroDescription: {
    color: '#BED4D9',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 260,
  },
  heroOrbit: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderWidth: 1,
    borderColor: '#28535F',
    borderRadius: 95,
    right: -100,
    top: -20,
  },
  heroOrbitSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: '#28535F',
    borderRadius: 70,
    right: -75,
    top: 5,
  },
  connection: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: 16,
    gap: 14,
    ...tokens.shadow,
  },
  connectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectionIcon: {
    width: 40,
    height: 40,
    backgroundColor: tokens.colors.successSoft,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: { flex: 1, gap: 4 },
  connectionTitle: {
    color: tokens.colors.heading,
    fontSize: 15,
    fontWeight: '700',
  },
  caption: { color: tokens.colors.muted, fontSize: 12, lineHeight: 18 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: tokens.colors.success,
  },
  sectionHeading: { gap: 5, marginTop: 5 },
  sectionTitle: {
    color: tokens.colors.heading,
    fontSize: 19,
    fontWeight: '700',
  },
  sectionOverline: {
    color: tokens.colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: {
    flex: 1,
    minWidth: 140,
    padding: 18,
    gap: 10,
    borderRadius: tokens.radius,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    ...tokens.shadow,
  },
  actionIcon: {
    width: 42,
    height: 42,
    backgroundColor: tokens.colors.primarySoft,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: tokens.colors.heading,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  actionLink: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginTop: 3,
  },
  linkText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 12 },
  pressed: { opacity: 0.75 },
  contribution: {
    backgroundColor: tokens.colors.primarySoft,
    padding: 18,
    borderRadius: tokens.radius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contributionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributionText: { flex: 1, gap: 5 },
});
