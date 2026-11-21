export type ScientificJob = {
  error_message?: string | null;
  /** Format: uuid */
  id: string;
  progress?: number | null;
  /** @enum {string} */
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Format: date-time */
  updated_at: string;
};

export type ScientificJobStatus = ScientificJob['status'];

export const scientificJobStatuses = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const satisfies readonly ScientificJobStatus[];
