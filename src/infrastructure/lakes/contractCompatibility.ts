import type { components } from '../shared/contracts/api.generated';
import type {
  Lake,
  LakeDetail,
  LakeListResponse,
  Station,
} from '../../domain/lakes/types';

type Assert<T extends true> = T;
type Compatible<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

// Checked by tsc without making the domain depend on generated transport types.
export type CatalogContractCompatibility = [
  Assert<Compatible<Lake, components['schemas']['Lake']>>,
  Assert<Compatible<LakeDetail, components['schemas']['LakeDetail']>>,
  Assert<
    Compatible<LakeListResponse, components['schemas']['LakeListResponse']>
  >,
  Assert<Compatible<Station, components['schemas']['Station']>>,
];
