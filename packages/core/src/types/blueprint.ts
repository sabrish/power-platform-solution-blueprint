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
 * Detailed entity metadata with all fields, relationships, and keys
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
  OwnershipType?: number;
  OwnershipTypeName?: string;
  IsAuditEnabled?: {
    Value: boolean;
  };
  ChangeTrackingEnabled?: boolean;
  IsActivity?: boolean;
  IsActivityParty?: boolean;
  ObjectTypeCode?: number;
  Attributes?: AttributeMetadata[];
  Keys?: EntityKey[];
  ManyToOneRelationships?: ManyToOneRelationship[];
  OneToManyRelationships?: OneToManyRelationship[];
  ManyToManyRelationships?: ManyToManyRelationship[];
}

/**
 * Attribute metadata with type-specific properties
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
  IsSecured?: boolean;
  RequiredLevel: {
    Value: string;
  };
  Description?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  IsCustomAttribute?: boolean;
  IsManaged?: boolean;
  // Type-specific properties
  MaxLength?: number;
  Precision?: number;
  MinValue?: number | { Value: number };
  MaxValue?: number | { Value: number };
  Format?: string;
  DateTimeBehavior?: {
    Value: string;
  };
  Targets?: string[];
  OptionSet?: {
    Options: OptionMetadata[];
  };
}

/**
 * Option metadata for picklist/state/status attributes
 */
export interface OptionMetadata {
  Value: number;
  Label: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  Color?: string;
}

/**
 * Entity key metadata (alternate keys)
 */
export interface EntityKey {
  LogicalName: string;
  DisplayName?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  KeyAttributes: string[];
  EntityKeyIndexStatus?: string;
}

/**
 * One-to-Many relationship (this entity is parent)
 */
export interface OneToManyRelationship {
  SchemaName: string;
  MetadataId?: string;
  ReferencingEntity: string;
  ReferencedEntity: string;
  ReferencingAttribute: string;
  ReferencedAttribute: string;
  CascadeConfiguration?: CascadeConfiguration;
  IsCustomRelationship?: boolean;
  IsManaged?: boolean;
}

/**
 * Many-to-One relationship (this entity is child)
 */
export interface ManyToOneRelationship {
  SchemaName: string;
  MetadataId?: string;
  ReferencingEntity: string;
  ReferencedEntity: string;
  ReferencingAttribute: string;
  ReferencedAttribute: string;
  CascadeConfiguration?: CascadeConfiguration;
  IsCustomRelationship?: boolean;
  IsManaged?: boolean;
}

/**
 * Many-to-Many relationship
 */
export interface ManyToManyRelationship {
  SchemaName: string;
  MetadataId?: string;
  Entity1LogicalName: string;
  Entity2LogicalName: string;
  IntersectEntityName: string;
  Entity1IntersectAttribute: string;
  Entity2IntersectAttribute: string;
  IsCustomRelationship?: boolean;
  IsManaged?: boolean;
}

/**
 * Cascade configuration for relationships
 */
export interface CascadeConfiguration {
  Assign?: string;
  Delete?: string;
  Merge?: string;
  Reparent?: string;
  Share?: string;
  Unshare?: string;
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
  id: string;
  name: string;
  description: string | null;
  state: 'Draft' | 'Active';
  entity: string;
  entityDisplayName: string | null;
  scope: 'Entity' | 'AllForms' | 'SpecificForm';
  scopeName: string;
  formId: string | null;
  formName: string | null;
  definition: BusinessRuleDefinition;
  owner: string;
  modifiedOn: string;
  createdOn: string;
}

/**
 * Parsed business rule definition from XAML
 */
export interface BusinessRuleDefinition {
  conditions: Condition[];
  actions: Action[];
  executionContext: 'Client' | 'Server' | 'Both';
  conditionLogic: string;
  parseError?: string;
}

/**
 * Business rule condition
 */
export interface Condition {
  field: string;
  operator: string;
  value: string;
  logicOperator: 'AND' | 'OR';
}

/**
 * Business rule action
 */
export interface Action {
  type: 'ShowField' | 'HideField' | 'SetValue' | 'SetRequired' | 'LockField' | 'UnlockField' | 'ShowError';
  field: string;
  value?: string;
  message?: string;
}

/**
 * Form event handler information
 */
export interface FormEventHandler {
  event: 'OnLoad' | 'OnSave' | 'OnChange' | 'TabStateChange' | 'OnReadyStateComplete' | 'OnRecordSelect';
  libraryName: string;
  functionName: string;
  attribute?: string; // For OnChange events
  enabled: boolean;
  parameters?: string;
}

/**
 * Form information with JavaScript handlers
 */
export interface FormDefinition {
  id: string;
  name: string;
  type: number; // 2=Main, 7=Quick Create, 8=Quick View, etc.
  typeName: string;
  entity: string;
  formXml: string;
  libraries: string[]; // Web resource names
  eventHandlers: FormEventHandler[];
}

/**
 * Web resource information
 */
export interface WebResource {
  id: string;
  name: string;
  displayName: string;
  type: number;
  typeName: string;
  content: string | null;
  contentSize: number;
  description: string | null;
  analysis: JavaScriptAnalysis | null;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
  hasExternalCalls: boolean;
  isDeprecated: boolean;
}

/**
 * JavaScript analysis results
 */
export interface JavaScriptAnalysis {
  externalCalls: ExternalCall[];
  usesXrm: boolean;
  usesDeprecatedXrmPage: boolean;
  frameworks: string[];
  linesOfCode: number;
  complexity: 'Low' | 'Medium' | 'High';
}

/**
 * Web resource type name mapping
 */
export const WEB_RESOURCE_TYPE_NAMES = {
  1: 'HTML',
  2: 'CSS',
  3: 'JavaScript',
  4: 'XML',
  5: 'PNG',
  6: 'JPG',
  7: 'GIF',
  9: 'XSL',
  10: 'ICO',
  11: 'SVG',
  12: 'RESX',
} as const;

/**
 * Execution pipeline for an entity event
 */
export interface ExecutionPipeline {
  event: string;
  clientSide: ExecutionStep[];
  serverSideSync: {
    preValidation: ExecutionStep[];
    preOperation: ExecutionStep[];
    mainOperation: ExecutionStep[];
    postOperation: ExecutionStep[];
  };
  serverSideAsync: ExecutionStep[];
  totalSteps: number;
  hasExternalCalls: boolean;
  performanceRisks: PerformanceRisk[];
}

/**
 * Single step in execution pipeline
 */
export interface ExecutionStep {
  order: number;
  type: 'Plugin' | 'Flow' | 'BusinessRule' | 'JavaScript';
  name: string;
  id: string;
  stage?: number;
  rank?: number;
  mode: 'Sync' | 'Async' | 'Client';
  hasExternalCall: boolean;
  externalEndpoints?: string[];
  description?: string;
  duration?: string;
}

/**
 * Performance risk detected in pipeline
 */
export interface PerformanceRisk {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  step: ExecutionStep;
  reason: string;
  recommendation: string;
}

/**
 * Complete blueprint for a single entity
 */
export interface EntityBlueprint {
  entity: DetailedEntityMetadata;
  plugins: PluginStep[];
  flows: Flow[];
  businessRules: BusinessRule[];
  forms: FormDefinition[];
  executionPipelines?: Map<string, ExecutionPipeline>;
  performanceRisks?: PerformanceRisk[];
}

/**
 * Summary of blueprint generation
 */
export interface BlueprintSummary {
  totalEntities: number;
  totalPlugins: number;
  totalFlows: number;
  totalBusinessRules: number;
  totalClassicWorkflows: number;
  totalBusinessProcessFlows: number;
  totalCustomAPIs: number;
  totalEnvironmentVariables: number;
  totalConnectionReferences: number;
  totalGlobalChoices: number;
  totalAttributes: number;
  totalWebResources: number;
  totalCanvasApps: number;
  totalCustomPages: number;
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
  businessRules: BusinessRule[];
  businessRulesByEntity: Map<string, BusinessRule[]>;
  classicWorkflows: import('./classicWorkflow.js').ClassicWorkflow[];
  classicWorkflowsByEntity: Map<string, import('./classicWorkflow.js').ClassicWorkflow[]>;
  businessProcessFlows: import('./businessProcessFlow.js').BusinessProcessFlow[];
  businessProcessFlowsByEntity: Map<string, import('./businessProcessFlow.js').BusinessProcessFlow[]>;
  customAPIs: import('./customApi.js').CustomAPI[];
  environmentVariables: import('./environmentVariable.js').EnvironmentVariable[];
  connectionReferences: import('./connectionReference.js').ConnectionReference[];
  globalChoices: import('./globalChoice.js').GlobalChoice[];
  webResources: WebResource[];
  webResourcesByType: Map<string, WebResource[]>;
}

// Re-export PluginStep from types.ts
export type { PluginStep, ImageDefinition } from '../types.js';
