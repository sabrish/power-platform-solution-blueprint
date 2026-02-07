/**
 * Blueprint generation types for PPSB
 */
import type { PluginStep } from '../types.js';

/**
 * Progress phases during blueprint generation
 */
export type ProgressPhase =
  | 'discovering'
  | 'schema'
  | 'plugins'
  | 'flows'
  | 'business-rules'
  | 'complete';

/**
 * Progress information during blueprint generation
 */
export interface ProgressInfo {
  phase: ProgressPhase;
  entityName: string;
  current: number;
  total: number;
  message: string;
}

/**
 * Options for blueprint generation
 */
export interface GeneratorOptions {
  includeSystemEntities: boolean;
  onProgress?: (progress: ProgressInfo) => void;
  signal?: AbortSignal;
}

/**
 * Detailed entity metadata with all fields
 */
export interface DetailedEntityMetadata {
  LogicalName: string;
  SchemaName: string;
  DisplayName: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  MetadataId: string;
  EntitySetName: string;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  IsCustomEntity?: boolean;
  IsManaged?: boolean;
  IsCustomizable?: {
    Value: boolean;
  };
  Description?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  Attributes?: AttributeMetadata[];
  Keys?: EntityKey[];
}

/**
 * Attribute metadata
 */
export interface AttributeMetadata {
  LogicalName: string;
  SchemaName: string;
  MetadataId?: string;
  DisplayName?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  AttributeType: string;
  IsPrimaryId: boolean;
  IsPrimaryName: boolean;
  IsValidForCreate: boolean;
  IsValidForUpdate: boolean;
  IsValidForRead: boolean;
  IsValidForAdvancedFind?: {
    Value: boolean;
  };
  IsAuditEnabled?: {
    Value: boolean;
  };
  RequiredLevel: {
    Value: string;
  };
  Description?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
}

/**
 * Entity key metadata
 */
export interface EntityKey {
  LogicalName: string;
  DisplayName?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  KeyAttributes: string[];
}

/**
 * Flow information
 */
export interface Flow {
  id: string;
  name: string;
  description: string | null;
  state: 'Draft' | 'Active' | 'Suspended';
  stateCode: number;
  entity: string | null;
  entityDisplayName: string | null;
  scope: number;
  scopeName: string;
  owner: string;
  ownerId: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
  definition: FlowDefinition;
  hasExternalCalls: boolean;
}

/**
 * Parsed flow definition from clientdata
 */
export interface FlowDefinition {
  triggerType: 'Dataverse' | 'Manual' | 'Scheduled' | 'Other';
  triggerEvent: 'Create' | 'Update' | 'Delete' | 'CreateOrUpdate' | 'Manual' | 'Scheduled' | 'Unknown';
  triggerConditions: string | null;
  scopeType: 'User' | 'BusinessUnit' | 'Organization' | 'Unknown';
  actionsCount: number;
  externalCalls: ExternalCall[];
  connectionReferences: string[];
}

/**
 * External HTTP call detected in flow
 */
export interface ExternalCall {
  url: string;
  domain: string;
  method: string | null;
  actionName: string;
  confidence: 'High' | 'Medium' | 'Low';
}

/**
 * Flow state color coding
 */
export const FLOW_STATE_COLORS = {
  'Active': '#107C10',
  'Draft': '#FFB900',
  'Suspended': '#D13438',
} as const;

/**
 * Business rule information
 */
export interface BusinessRule {
  ruleId: string;
  name: string;
  scope: string;
  isManaged: boolean;
}

/**
 * Complete blueprint for a single entity
 */
export interface EntityBlueprint {
  entity: DetailedEntityMetadata;
  plugins: PluginStep[];
  flows: Flow[];
  businessRules: BusinessRule[];
}

/**
 * Summary of blueprint generation
 */
export interface BlueprintSummary {
  totalEntities: number;
  totalPlugins: number;
  totalFlows: number;
  totalBusinessRules: number;
  totalAttributes: number;
  totalWebResources: number;
  totalCanvasApps: number;
  totalCustomPages: number;
  totalConnectionReferences: number;
}

/**
 * Metadata about the blueprint generation
 */
export interface BlueprintMetadata {
  generatedAt: Date;
  environment: string;
  scope: {
    type: string;
    description: string;
  };
  entityCount: number;
}

/**
 * Complete blueprint result
 */
export interface BlueprintResult {
  metadata: BlueprintMetadata;
  entities: EntityBlueprint[];
  summary: BlueprintSummary;
  plugins: PluginStep[];
  pluginsByEntity: Map<string, PluginStep[]>;
  flows: Flow[];
  flowsByEntity: Map<string, Flow[]>;
}

// Re-export PluginStep from types.ts
export type { PluginStep, ImageDefinition } from '../types.js';
