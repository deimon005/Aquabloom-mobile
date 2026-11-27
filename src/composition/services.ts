import type { AppServices } from '../application/shared/AppServices';
import { env, environment } from './config';
import {
  authClient,
  sessionRefresh,
  signInWithPassword,
  signUpWithPassword,
  signOutAndClearCache,
} from './auth';
import { setCatalogIdentity } from './catalogCache';
import { catalogQueries } from './lakes';
import { scientificQueries } from './scientific';
import { scientificApiEnabled } from './scientificSource';
import * as observations from './observations';
import { healthConfigured, loadHealth } from './health';
import { subscribeConnectivity } from './connectivity';
export function createAppServices(): AppServices {
  return {
    config: {
      authProvider: env.authProvider,
      apiUrl: env.apiUrl,
      environmentValid: environment.success,
      scientificApiEnabled,
    },
    auth: {
      client: authClient,
      sessionRefresh,
      signInWithPassword,
      signUpWithPassword,
      signOutAndClearCache,
      setCatalogIdentity,
    },
    catalogQueries,
    scientificQueries,
    observations,
    health: { configured: healthConfigured, loadHealth },
    subscribeConnectivity,
  };
}
