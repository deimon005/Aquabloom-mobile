import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../composition/AppProviders';
import { tokens } from '../presentation/shared/theme/tokens';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tokens.colors.navy },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: tokens.colors.background },
        }}
      >
        <Stack.Screen
          name="lakes/[id]/estimates/index"
          options={{ title: 'Estimaciones del lago' }}
        />
        <Stack.Screen
          name="lakes/[id]/estimates/[estimateId]"
          options={{ title: 'Detalle de estimación' }}
        />
        <Stack.Screen
          name="scientific/jobs/[jobId]"
          options={{ title: 'Trabajo científico' }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="register" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen
          name="lakes/[id]"
          options={{ title: 'Detalle de lago' }}
        />
        <Stack.Screen
          name="lakes/[id]/observations"
          options={{ title: 'Observación de terreno' }}
        />
        <Stack.Screen
          name="lakes/[id]/stations/[stationId]"
          options={{ title: 'Estación' }}
        />
      </Stack>
    </AppProviders>
  );
}
