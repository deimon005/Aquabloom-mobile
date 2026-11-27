import type { components } from '../shared/contracts/scientific.proposal.generated';
import type {
  EstimatePoint,
  EstimateListResponse,
} from '../../domain/scientific/estimates';
import type { ScientificJob } from '../../domain/scientific/jobs';

type Assert<T extends true> = T;
type Compatible<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

export type ScientificContractCompatibility = [
  Assert<Compatible<EstimatePoint, components['schemas']['EstimatePoint']>>,
  Assert<
    Compatible<
      EstimateListResponse,
      components['schemas']['EstimateListResponse']
    >
  >,
  Assert<Compatible<ScientificJob, components['schemas']['ScientificJob']>>,
];
