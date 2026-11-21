import { z } from 'zod';
import { catalogId } from '../../../../domain/catalogId';
import type { components } from '../../../../types/scientific.proposal.generated';
import type { ScientificJob } from '../../domain/job';
import { scientificJobStatuses } from '../../domain/job';

const scientificJobSchema = z.object({
  id: catalogId,
  status: z.enum(scientificJobStatuses),
  updated_at: z.iso.datetime(),
  progress: z.number().finite().min(0).max(100).nullable().optional(),
  error_message: z.string().nullable().optional(),
}) satisfies z.ZodType<components['schemas']['ScientificJob']>;

export function parseScientificJob(id: string, value: unknown): ScientificJob {
  const job = scientificJobSchema.parse(value);
  if (job.id.toLowerCase() !== id) {
    throw new Error('La respuesta corresponde a otro trabajo.');
  }
  return job;
}
