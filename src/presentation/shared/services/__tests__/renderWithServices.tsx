/* eslint-disable @typescript-eslint/no-require-imports -- Resolve dependencies after each suite installs its Jest mocks. */
import { render as renderNative } from '@testing-library/react-native';
import type { PropsWithChildren, ReactElement } from 'react';
import type { AppServices } from '../../../../application/shared/AppServices';
import { AppServicesProvider } from '../AppServicesProvider';

// These lazy test dependencies preserve each suite's HTTP/native mocks. Production
// receives fully composed services from composition/AppProviders instead.
function testServices(): AppServices {
  return {
    get config() {
      const { env, environment } =
        require('../../../../infrastructure/shared/config/env') as typeof import('../../../../infrastructure/shared/config/env');
      return {
        apiUrl: env?.apiUrl,
        environmentValid: environment?.success ?? true,
        scientificApiEnabled:
          process.env.EXPO_PUBLIC_SCIENTIFIC_API_ENABLED === 'true',
      };
    },
    get auth() {
      const auth =
        require('../../../../composition/auth') as typeof import('../../../../composition/auth');
      const cache =
        require('../../../../composition/catalogCache') as typeof import('../../../../composition/catalogCache');
      return {
        ...auth,
        client: auth.authClient,
        setCatalogIdentity: cache.setCatalogIdentity,
      };
    },
    get catalogQueries() {
      return (
        require('../../../../composition/lakes') as typeof import('../../../../composition/lakes')
      ).catalogQueries;
    },
    get scientificQueries() {
      return (
        require('../../../../composition/scientific') as typeof import('../../../../composition/scientific')
      ).scientificQueries;
    },
    get observations() {
      return require('../../../../composition/observations') as typeof import('../../../../composition/observations');
    },
    get health() {
      const health =
        require('../../../../composition/health') as typeof import('../../../../composition/health');
      return {
        configured: health.healthConfigured,
        loadHealth: health.loadHealth,
      };
    },
    get subscribeConnectivity() {
      return (
        require('../../../../composition/connectivity') as typeof import('../../../../composition/connectivity')
      ).subscribeConnectivity;
    },
  };
}
export function render(
  element: ReactElement,
  options?: Parameters<typeof renderNative>[1],
) {
  const services = testServices();
  const OriginalWrapper = options?.wrapper;
  function Wrapper({ children }: PropsWithChildren) {
    const content = (
      <AppServicesProvider services={services}>{children}</AppServicesProvider>
    );
    return OriginalWrapper ? (
      <OriginalWrapper>{content}</OriginalWrapper>
    ) : (
      content
    );
  }
  return renderNative(element, { ...options, wrapper: Wrapper });
}
