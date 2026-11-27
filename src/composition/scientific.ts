import { onlineManager } from '@tanstack/react-query';
import { env } from '../infrastructure/shared/config/env';
import { catalogCache } from './catalogCache';
import { loadEstimates, loadJob } from './scientificSource';
import { createScientificQueries } from '../application/scientific/scientificQueries';
export const scientificQueries = createScientificQueries(
  { loadEstimates, loadJob },
  catalogCache,
  env.apiUrl,
  () => onlineManager.isOnline(),
);
