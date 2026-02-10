/**
 * Business Process Flow types
 */

/**
 * Business Process Flow (BPF) definition
 */
export interface BusinessProcessFlow {
  id: string;
  name: string;
  description: string | null;
  primaryEntity: string;
  primaryEntityDisplayName: string | null;
  state: 'Draft' | 'Active';
  stateCode: number;
  isManaged: boolean;
  uniqueName: string;
  xaml: string;
  definition: BPFDefinition;
  owner: string;
  ownerId: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
}

/**
 * Parsed BPF definition from XAML
 */
export interface BPFDefinition {
  stages: BPFStage[];
  entities: string[]; // Entities involved in the BPF
  totalSteps: number;
  crossEntityFlow: boolean; // True if BPF spans multiple entities
  parseError?: string;
}

/**
 * BPF Stage
 */
export interface BPFStage {
  id: string;
  name: string;
  entity: string; // Entity this stage operates on
  order: number;
  steps: BPFStep[];
}

/**
 * BPF Step (field requirement in a stage)
 */
export interface BPFStep {
  id: string;
  name: string;
  fieldName: string;
  required: boolean;
  order: number;
}

/**
 * BPF state colors for UI
 */
export const BPF_STATE_COLORS = {
  Active: '#107C10',
  Draft: '#FFB900',
} as const;
