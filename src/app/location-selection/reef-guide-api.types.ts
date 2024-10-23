export type SelectionCriteria = Record<string, [number, number]>;

export interface SiteSuitabilityCriteria {
  SuitabilityThreshold: number;
  xdist: number;
  ydist: number;
}

export interface CriteriaAssessment {
  criteria: SelectionCriteria;
  siteSuitability?: SiteSuitabilityCriteria;
}
