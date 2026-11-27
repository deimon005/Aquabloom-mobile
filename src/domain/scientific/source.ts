import { scientificJobStatuses } from './jobs';
export type ScientificSource = 'disabled' | 'proposal' | 'demo';
export function scientificSource(
  demo: unknown,
  enabled = false,
): ScientificSource {
  return demo === '1' ? 'demo' : enabled ? 'proposal' : 'disabled';
}
export const demoEstimateId = '22222222-2222-4222-8222-222222222222';
export const demoJobIds = scientificJobStatuses.map(
  (_, index) => `44444444-4444-4444-8444-44444444444${index}`,
);
