/**
 * Blueprint generation types for PPSB
 */
import type { PluginStep } from '../types.js';
import type { EntityFieldSecurity } from '../discovery/FieldSecurityProfileDiscovery.js';
import type { SecurityRoleDetail } from '../discovery/SecurityRoleDiscovery.js';
import type { FetchLogEntry } from '../utils/FetchLogger.js';
import type { CanvasApp } from './canvasApp.js';
import type { CustomPage } from './customPage.js';
import type { ModelDrivenApp } from './modelDrivenApp.js';

/**
 * Progress phases during blueprint generation
 */
export type ProgressPhase =
  | 'discovering'
  | 'schema'
  | 'plugins'
  | 'flows'
  | 'business-rules'
  | 'apps'
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
  onFetchEntry?: (entry: FetchLogEntry) => void;
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
  triggerEntity: string | null;
  triggerConditions: string | null;
  scopeType: 'User' | 'BusinessUnit' | 'Organization' | 'Unknown';
  actionsCount: number;
  externalCalls: ExternalCall[];
  connectionReferences: string[];
  dataverseActions?: DataverseAction[];
  /** Child flow IDs referenced by "Run a Child Flow" actions */
  childFlowIds?: string[];
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
  fieldSecurity?: EntityFieldSecurity;
}

/**
 * Summary of blueprint generation
 */
export interface BlueprintSummary {
  totalEntities: number;
  totalPlugins: number;
  totalPluginPackages: number;
  totalFlows: number;
  totalBusinessRules: number;
  totalClassicWorkflows: number;
  totalBusinessProcessFlows: number;
  totalCustomAPIs: number;
  totalEnvironmentVariables: number;
  totalConnectionReferences: number;
  totalGlobalChoices: number;
  totalCustomConnectors: number;
  totalSecurityRoles: number;
  totalFieldSecurityProfiles: number;
  totalAttributeMaskingRules: number;
  totalColumnSecurityProfiles: number;
  totalAttributes: number;
  totalWebResources: number;
  totalCanvasApps: number;
  totalCustomPages: number;
  totalModelDrivenApps: number;
}

/**
 * Metadata about the blueprint generation
 */
export interface BlueprintMetadata {
  generatedAt: Date;
  environment: string;
  solutionNames?: string[];
  scope: {
    type: string;
    description: string;
  };
  entityCount: number;
}

/**
 * Node in the ERD graph data model (used by the interactive viewer)
 */
export interface ERDNode {
  id: string;
  label: string;
  publisherPrefix: string;
  color: string;
  strokeColor: string;
  textColor: string;
}

/**
 * Edge in the ERD graph data model (used by the interactive viewer)
 */
export interface ERDEdge {
  id: string;
  source: string;
  target: string;
  /** For 1-N: the referencing attribute (FK on the child/source side) */
  label: string;
  type: '1-N' | 'N-N';
  /** For 1-N: the referenced attribute (PK on the parent/target side) */
  referencedAttribute?: string;
  /** For N-N: the intersection (junction) table name */
  intersectEntityName?: string;
}

/**
 * Graph data for the ERD interactive viewer
 */
export interface ERDGraphData {
  nodes: ERDNode[];
  edges: ERDEdge[];
}

/**
 * ERD (Entity Relationship Diagram) definition
 */
export interface ERDDefinition {
  diagrams: ERDDiagram[];
  legend: PublisherLegend[];
  entityQuickLinks: EntityQuickLink[];
  totalEntities: number;
  totalRelationships: number;
  warnings?: string[];
  graphData?: ERDGraphData;
}

/**
 * Individual ERD diagram (one per publisher or grouping)
 */
export interface ERDDiagram {
  id: string;
  title: string;
  description: string;
  mermaidDiagram: string;
  diagramType: 'mermaid-class' | 'mermaid-er';
  direction: 'TB' | 'LR';
  entityCount: number;
  relationshipCount: number;
}

/**
 * Publisher legend for ERD color coding
 */
export interface PublisherLegend {
  publisherPrefix: string;
  publisherName: string;
  color: string;
  entityCount: number;
  entities: string[];
}

/**
 * Entity quick link with summary stats
 */
export interface EntityQuickLink {
  logicalName: string;
  displayName: string;
  publisherPrefix: string;
  fieldCount: number;
  pluginCount: number;
  flowCount: number;
  businessRuleCount: number;
  complexity: 'High' | 'Medium' | 'Low';
}

/**
 * External API endpoint with risk assessment
 */
export interface ExternalEndpoint {
  url: string;
  domain: string;
  protocol: 'http' | 'https';
  riskLevel: 'Trusted' | 'Known' | 'Unknown';
  riskFactors: RiskFactor[];
  detectedIn: ExternalCallSource[];
  callCount: number;
}

/**
 * Risk factor for external endpoint
 */
export interface RiskFactor {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  factor: string;
  description: string;
  recommendation: string;
}

/**
 * Source of external call detection
 */
export interface ExternalCallSource {
  type: 'Plugin' | 'Flow' | 'JavaScript' | 'ClassicWorkflow' | 'CustomAPI';
  name: string;
  id: string;
  entity: string | null;
  mode: 'Sync' | 'Async' | 'Client';
  confidence: 'High' | 'Medium' | 'Low';
}

/**
 * Solution distribution analysis
 */
export interface SolutionDistribution {
  solutionName: string;
  solutionId: string;
  publisher: string;
  version: string;
  isManaged: boolean;
  componentCounts: ComponentCounts;
  sharedComponents: SharedComponent[];
  dependencies: SolutionDependency[];
}

/**
 * Component counts by type
 */
export interface ComponentCounts {
  entities: number;
  plugins: number;
  flows: number;
  businessRules: number;
  classicWorkflows: number;
  bpfs: number;
  webResources: number;
  customAPIs: number;
  environmentVariables: number;
  connectionReferences: number;
  globalChoices: number;
  customConnectors: number;
  securityRoles: number;
  fieldSecurityProfiles: number;
  canvasApps: number;
  customPages: number;
  modelDrivenApps: number;
  total: number;
}

/**
 * Shared component across solutions
 */
export interface SharedComponent {
  componentType: string;
  componentName: string;
  componentId: string;
  alsoInSolutions: string[];
}

/**
 * Solution dependency
 */
export interface SolutionDependency {
  dependsOnSolution: string;
  reason: string;
  componentReferences: string[];
}

/**
 * Dataverse action detected in flow
 */
export interface DataverseAction {
  operation: 'Create' | 'Update' | 'Get' | 'List' | 'Delete' | 'Action';
  targetEntity: string;
  actionName: string;
  confidence: 'High' | 'Medium' | 'Low';
  /** Fields being set (only populated for Create/Update operations) */
  fields?: string[];
  /**
   * For 'Action' operations: the Dataverse custom action / bound API unique name
   * (e.g. "new_SendWelcomeEmail"). Internal effects on the target entity are unknown.
   */
  customActionApiName?: string;
  /**
   * True for PerformUnboundAction calls — no entity target, effects not traceable.
   * These surface in the Global Chain Map only, never in per-entity pipeline views.
   */
  isUnbound?: boolean;
}

/**
 * Warning recorded when a discovery step fails partially or fully.
 * The blueprint continues — the affected section is empty or partial.
 */
export interface StepWarning {
  /** Human-readable step name, e.g. "Security Roles" */
  step: string;
  message: string;
  /** true if some data was returned before the failure */
  partial: boolean;
  /** Number of items that could not be fetched */
  failedCount?: number;
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
  customConnectors: import('./customConnector.js').CustomConnector[];
  canvasApps: CanvasApp[];
  customPages: CustomPage[];
  modelDrivenApps: ModelDrivenApp[];
  webResources: WebResource[];
  webResourcesByType: Map<string, WebResource[]>;
  erd?: ERDDefinition;
  crossEntityAnalysis?: import('./crossEntityTrace.js').CrossEntityAnalysisResult;
  externalEndpoints?: ExternalEndpoint[];
  solutionDistribution?: SolutionDistribution[];
  securityRoles?: SecurityRoleDetail[];
  fieldSecurityProfiles?: import('../discovery/FieldSecurityProfileDiscovery.js').FieldSecurityProfile[];
  attributeMaskingRules?: import('../discovery/ColumnSecurityDiscovery.js').AttributeMaskingRule[];
  columnSecurityProfiles?: import('../discovery/ColumnSecurityDiscovery.js').ColumnSecurityProfile[];
  /** Warnings from steps that failed or returned partial data */
  stepWarnings?: StepWarning[];
  /** Full fetch diagnostic log — every batched API call made during generation */
  fetchLog?: FetchLogEntry[];
}

/**
 * File tree node for markdown export structure
 */
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

/**
 * Markdown export result
 */
export interface MarkdownExport {
  files: Map<string, string>;
  structure: FileNode;
  totalFiles: number;
  totalSize: number;
}

/**
 * Export progress information
 */
export interface ExportProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

// Re-export PluginStep from types.ts
export type { PluginStep, ImageDefinition } from '../types.js';
