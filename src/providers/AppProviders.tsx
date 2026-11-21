import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '../features/connectivity/presentation/ConnectivityBanner';
import { ApiError } from '../lib/http';
import { ConnectivityProvider } from './ConnectivityProvider';
import { AuthProvider } from '../features/auth/AuthProvider';
import { SessionLifecycle } from '../features/auth/SessionLifecycle';
import { OfflineCacheMissError } from '../features/offline/data/cache';

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
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
  return (
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
  );
}

const styles = StyleSheet.create({
  application: { flex: 1 },
  content: { flex: 1 },
});
