import { JobTypePayload_RegionalAssessment } from "../../api/web-api.types";

/**
 * The original criteria names used by ReefGuideApi.jl REST API
 * minimum and maximum are the first and second array values.
 * Example names: Depth, WavesHs
 * The new job system uses slightly different names, e.g. depth_min, depth_max
 */
export type SelectionCriteria = Record<string, [number, number]>;


// temporary mapping, we should rename criteria ids in API to be consistent
// TODO when we refactor (probably when switch to monorepo)
export const criteriaIdToPayloadId: Record<string, string> = {
  Depth: 'depth',
  Slope: 'slope',
  // removed from app code
  // Turbidity: 'turbidity',
  WavesHs: 'waves_height',
  WavesTp: 'waves_period'
};

/**
 * Convert a SelectionCriteria object's properties to a new object with
 * job style criteria names using criteriaToPayloadId mapping.
 */
export function criteriaToJobPayload(criteria: SelectionCriteria): JobTypePayload_RegionalAssessment {
  // Partial<JobTypePayload_RegionalAssessment>
  const payload: Record<string, any> = {
    reef_type: 'slopes',
    // TODO rugosity+threshold required by worker code JSON deserializer.
    // see https://github.com/open-AIMS/ReefGuideAPI.jl/issues/69
    rugosity_min: 0.0,
    rugosity_max: 6.0,
    threshold: 95
  };

  for (let [criteriaId, range] of Object.entries(criteria)) {
    const payloadProp = criteriaIdToPayloadId[criteriaId];
    if (payloadProp === undefined) {
      throw new Error(`"${criteriaId}" has no mapping to job payload property name`);
    }
    payload[`${payloadProp}_min`] = range[0];
    payload[`${payloadProp}_max`] = range[1];
  }
  return payload as JobTypePayload_RegionalAssessment;
}

export interface SiteSuitabilityCriteria {
  SuitabilityThreshold: number;
  xdist: number;
  ydist: number;
}

export interface CriteriaAssessment {
  criteria: SelectionCriteria;
  siteSuitability?: SiteSuitabilityCriteria;
}
