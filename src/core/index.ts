// Types
export type { Publisher, Solution, EntityMetadata, PluginStep, ImageDefinition } from './types.js';
export type { ClassicWorkflow, MigrationRecommendation, MigrationFeature } from './types/classicWorkflow.js';
export type { BusinessProcessFlow, BPFDefinition, BPFStage, BPFStep } from './types/businessProcessFlow.js';
export type { CustomAPI, CustomAPIParameter, CustomAPIParameterType } from './types/customApi.js';
export type { EnvironmentVariable, EnvironmentVariableValue, EnvironmentVariableType } from './types/environmentVariable.js';
export type { ConnectionReference } from './types/connectionReference.js';
export type { GlobalChoice, GlobalChoiceOption } from './types/globalChoice.js';
export type { CustomConnector } from './types/customConnector.js';
export type { CanvasApp } from './types/canvasApp.js';
export type { CustomPage } from './types/customPage.js';
export type { ModelDrivenApp } from './types/modelDrivenApp.js';
export type { PcfControl } from './types/pcfControl.js';
export type { ServiceEndpoint, ServiceEndpointContract } from './types/serviceEndpoint.js';
export type { CopilotAgent, AgentKind } from './types/copilotAgent.js';
export type {
  ProgressPhase,
  ProgressInfo,
  GeneratorOptions,
  DetailedEntityMetadata,
  AttributeMetadata,
  OptionMetadata,
  EntityKey,
  OneToManyRelationship,
  ManyToOneRelationship,
  ManyToManyRelationship,
  CascadeConfiguration,
  Flow,
  BusinessRule,
  BusinessRuleDefinition,
  Condition,
  Action,
  FormDefinition,
  FormEventHandler,
  WebResource,
  JavaScriptAnalysis,
  ExternalCall,
  ExecutionPipeline,
  ExecutionStep,
  PerformanceRisk,
  EntityBlueprint,
  BlueprintSummary,
  BlueprintMetadata,
  BlueprintResult,
  ERDDefinition,
  ERDDiagram,
  ERDGraphData,
  ERDNode,
  ERDEdge,
  PublisherLegend,
  EntityQuickLink,
  ExternalEndpoint,
  RiskFactor,
  ExternalCallSource,
  SolutionDistribution,
  ComponentCounts,
  SharedComponent,
  SolutionDependency,
  DataverseAction,
  FileNode,
  MarkdownExport,
  ExportProgress,
} from './types/blueprint.js';
export type {
  ComponentInventory,
  WorkflowInventory,
  ComponentType,
  WorkflowCategory,
} from './types/components.js';

// Dataverse Client
export type { IDataverseClient, QueryOptions, QueryResult } from './dataverse/IDataverseClient.js';
export { PptbDataverseClient } from './dataverse/PptbDataverseClient.js';

// Discovery Services — only the two used directly by UI (ScopeSelector)
export { PublisherDiscovery } from './discovery/PublisherDiscovery.js';
export { SolutionDiscovery } from './discovery/SolutionDiscovery.js';
// Type-only exports for discovery modules consumed by UI components
export type {
  FieldSecurityProfile,
  FieldPermission,
  EntityFieldSecurity,
  SecuredField,
  FieldSecurityProfilePermission,
} from './discovery/FieldSecurityProfileDiscovery.js';
export type {
  SecurityRole,
  RolePrivilege,
  PrivilegeDetail,
  EntityPermission,
  SecurityRoleDetail,
  SpecialPermissions,
  EntitySecurityAccess,
} from './discovery/SecurityRoleDiscovery.js';
export type {
  AttributeMaskingRule,
  ColumnSecurityProfile,
  ColumnPermission,
} from './discovery/ColumnSecurityDiscovery.js';

// Generators
export { BlueprintGenerator } from './generators/BlueprintGenerator.js';
export type { ScopeSelection as BlueprintScope } from './generators/BlueprintGenerator.js';

// Cross-entity trace types
export type {
  CrossEntityEntryPoint,
  AutomationActivation,
  CrossEntityBranch,
  CrossEntityTrace,
  CrossEntityEntityView,
  CrossEntityRisk,
  CrossEntityAnalysisResult,
  CrossEntityChainLink,
  EntityAutomationPipeline,
  MessagePipeline,
  PipelineStep,
} from './types/crossEntityTrace.js';

// Analyzers — only those consumed by UI components via barrel
export { ExecutionOrderCalculator } from './analyzers/ExecutionOrderCalculator.js';
export { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';

// Utils — FetchLogger types used by ProcessingScreen and useBlueprint via barrel
// FetchLogger class is imported directly by consumers, not through this barrel
export type { FetchLogEntry, FetchStatus, FetchSummary } from './utils/FetchLogger.js';
