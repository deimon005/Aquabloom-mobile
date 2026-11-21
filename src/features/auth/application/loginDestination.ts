import { isCatalogId } from '../../../domain/catalogId';

// Only known internal destinations may be supplied through a deep link.
export function loginDestination(value: string | string[] | undefined) {
  if (typeof value === 'string') {
    const estimates = /^\/lakes\/([^/]+)\/estimates(?:\/([^/]+))?$/.exec(value);
    if (estimates && isCatalogId(estimates[1])) {
      if (!estimates[2])
        return {
          pathname: '/lakes/[id]/estimates' as const,
          params: { id: estimates[1] },
        };
      if (isCatalogId(estimates[2]))
        return {
          pathname: '/lakes/[id]/estimates/[estimateId]' as const,
          params: { id: estimates[1], estimateId: estimates[2] },
        };
    }
    const job = /^\/scientific\/jobs\/([^/]+)$/.exec(value);
    if (job && isCatalogId(job[1]))
      return {
        pathname: '/scientific/jobs/[jobId]' as const,
        params: { jobId: job[1] },
      };
    const match = /^\/lakes\/([^/]+)\/observations$/.exec(value);
    if (match && isCatalogId(match[1]))
      return {
        pathname: '/lakes/[id]/observations' as const,
        params: { id: match[1] },
      };
  }
  return value === '/profile' ? ('/profile' as const) : ('/' as const);
}
