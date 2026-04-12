/**
 * SLA (Service Level Agreement) Definition types
 */

export type SlaType = 'Standard' | 'Enhanced';
export type SlaStatus = 'Draft' | 'Active' | 'Cancelled' | 'Expired';

/**
 * A Service Level Agreement (SLA) definition.
 * Component type code: 152 — Strategy A discovery via solutioncomponents.
 */
export interface SlaDefinition {
  id: string;
  name: string;
  description: string | null;
  slaType: SlaType;
  primaryEntityOtc: number | null;
  status: SlaStatus;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
