import type {
  AuthClient,
  SessionCache,
  SessionRefresh,
} from '../../domain/auth/auth';
import type { LoginCredentials } from '../../domain/auth/loginSchema';
import type {
  RegistrationCredentials,
  RegistrationResult,
} from '../../domain/auth/registration';
import type { CaptureServices } from '../../domain/observations/captureTypes';
import type { ObservationStore } from '../../domain/observations/ObservationStore';
import type { PhotoStorage } from '../../domain/observations/photoStorage';
import type { ConnectivityStatus } from '../../domain/connectivity/connectivity';
import type { createCatalogQueries } from '../lakes/catalogQueries';
import type { createScientificQueries } from '../scientific/scientificQueries';

export type AppServices = {
  config: {
    authProvider?: 'local' | 'supabase';
    apiUrl?: string;
    environmentValid: boolean;
    scientificApiEnabled: boolean;
  };
  auth: {
    client: AuthClient | null;
    sessionRefresh: SessionRefresh | null;
    signInWithPassword: (credentials: LoginCredentials) => Promise<void>;
    signUpWithPassword: (
      credentials: RegistrationCredentials,
    ) => Promise<RegistrationResult>;
    signOutAndClearCache: (
      client: AuthClient | null,
      queries: SessionCache,
    ) => Promise<void>;
    setCatalogIdentity: (userId: string | null) => void;
  };
  catalogQueries: ReturnType<typeof createCatalogQueries>;
  scientificQueries: ReturnType<typeof createScientificQueries>;
  observations: {
    captureServices: CaptureServices;
    observationStore: ObservationStore;
    photoPersistence: PhotoStorage;
  };
  health: {
    configured: boolean;
    loadHealth: (signal?: AbortSignal) => Promise<unknown>;
  };
  subscribeConnectivity: (
    listener: (status: ConnectivityStatus) => void,
  ) => () => void;
};
