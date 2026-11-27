import { z } from 'zod';
import { catalogId } from '../lakes/catalogSchemas';

export const scientificJobStatuses = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

const scientificJobSchema = z.object({
  id: catalogId,
  status: z.enum(scientificJobStatuses),
  updated_at: z.iso.datetime(),
  progress: z.number().finite().min(0).max(100).nullable().optional(),
  error_message: z.string().nullable().optional(),
});

export function parseScientificJob(id: string, value: unknown): ScientificJob {
  const job = scientificJobSchema.parse(value);
  if (job.id.toLowerCase() !== id) {
    throw new Error('La respuesta corresponde a otro trabajo.');
  }
  return job;
}

export type ScientificJob = z.infer<typeof scientificJobSchema>;
export type ScientificJobStatus = ScientificJob['status'];
