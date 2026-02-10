/**
 * Classic Workflow types (deprecated workflows requiring migration)
 */

/**
 * Classic workflow (legacy, requires migration to Power Automate)
 */
export interface ClassicWorkflow {
  id: string;
  name: string;
  description: string | null;
  type: number;
  typeName: string; // Definition, Activation, Template
  mode: number;
  modeName: string; // Background, RealTime
  triggerOnCreate: boolean;
  triggerOnUpdate: boolean;
  triggerOnDelete: boolean;
  onDemand: boolean; // Manual trigger
  scope: number;
  scopeName: string;
  entity: string;
  entityDisplayName: string | null;
  state: 'Draft' | 'Active' | 'Suspended';
  isManaged: boolean;
  xaml: string;
  owner: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
  migrationRecommendation?: MigrationRecommendation;
}

/**
 * Migration recommendation for classic workflow
 */
export interface MigrationRecommendation {
  complexity: 'Low' | 'Medium' | 'High' | 'Critical';
  effort: string; // "1-2 hours", "1-2 days", "1+ weeks"
  approach: string; // Step-by-step migration guide
  challenges: string[]; // Known issues
  features: MigrationFeature[]; // Detected features
  documentationLink: string; // Microsoft docs
}

/**
 * Detected workflow feature for migration analysis
 */
export interface MigrationFeature {
  feature: string;
  recommendation: string;
  migrationPath: string;
}
