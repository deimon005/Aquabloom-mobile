import { createAppServices } from './services';
import { AppServicesProvider } from '../presentation/shared/services/AppServicesProvider';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '../presentation/connectivity/ConnectivityBanner';
import { ApiError } from '../infrastructure/shared/http';
import { ConnectivityProvider } from '../presentation/connectivity/ConnectivityProvider';
import { AuthProvider } from '../presentation/auth/AuthProvider';
import { SessionLifecycle } from '../presentation/auth/SessionLifecycle';
import { OfflineCacheMissError } from '../domain/offline/cache';

export const queryCachePolicy = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  maxRetries: 2,
} as const;

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (error instanceof OfflineCacheMissError) return false;
  if (error instanceof Error && error.name === 'AbortError') return false;
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < queryCachePolicy.maxRetries;
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: queryCachePolicy.staleTime,
        gcTime: queryCachePolicy.gcTime,
        retry: shouldRetryQuery,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(createAppQueryClient);
  const [services] = useState(createAppServices);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
  return (
    <AppServicesProvider services={services}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <SessionLifecycle />
          <ConnectivityProvider>
            <View style={styles.application}>
              <ConnectivityBanner />
              <View style={styles.content}>
                <AuthProvider>{children}</AuthProvider>
              </View>
            </View>
          </ConnectivityProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppServicesProvider>
  );
}

const styles = StyleSheet.create({
  application: { flex: 1 },
  content: { flex: 1 },
});
