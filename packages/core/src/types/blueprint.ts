/**
 * Blueprint generation types for PPSB
 */

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
  Description?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  Attributes: AttributeMetadata[];
  Keys?: EntityKey[];
}

/**
 * Attribute metadata
 */
export interface AttributeMetadata {
  LogicalName: string;
  SchemaName: string;
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
 * Plugin step information
 */
export interface PluginStep {
  stepId: string;
  name: string;
  pluginTypeName: string;
  stage: number;
  mode: number;
  rank: number;
  message: string;
  filteringAttributes?: string;
}

/**
 * Flow information
 */
export interface Flow {
  flowId: string;
  name: string;
  type: string;
  trigger: string;
  state: string;
}

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
}
