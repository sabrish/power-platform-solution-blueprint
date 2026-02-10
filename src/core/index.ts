// Types
export type { Publisher, Solution, EntityMetadata, PluginStep, ImageDefinition } from './types.js';
export { STAGE_COLORS } from './types.js';
export type { ClassicWorkflow, MigrationRecommendation, MigrationFeature } from './types/classicWorkflow.js';
export type { BusinessProcessFlow, BPFDefinition, BPFStage, BPFStep } from './types/businessProcessFlow.js';
export { BPF_STATE_COLORS } from './types/businessProcessFlow.js';
export type { CustomAPI, CustomAPIParameter, CustomAPIParameterType } from './types/customApi.js';
export { CUSTOM_API_BINDING_COLORS, CUSTOM_API_TYPE_COLORS } from './types/customApi.js';
export type { EnvironmentVariable, EnvironmentVariableValue, EnvironmentVariableType } from './types/environmentVariable.js';
export { ENV_VAR_TYPE_COLORS } from './types/environmentVariable.js';
export type { ConnectionReference } from './types/connectionReference.js';
export { CONNECTION_STATUS_COLORS } from './types/connectionReference.js';
export type { GlobalChoice, GlobalChoiceOption } from './types/globalChoice.js';
export { GLOBAL_CHOICE_STATUS_COLORS } from './types/globalChoice.js';
export type { CustomConnector } from './types/customConnector.js';
export { CUSTOM_CONNECTOR_TYPE_COLORS } from './types/customConnector.js';
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
  PublisherLegend,
  EntityQuickLink,
  CrossEntityLink,
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
export { WEB_RESOURCE_TYPE_NAMES } from './types/blueprint.js';
export type {
  ComponentInventory,
  WorkflowInventory,
  ComponentType,
  WorkflowCategory,
} from './types/components.js';

// Dataverse Client
export type { IDataverseClient, QueryOptions, QueryResult } from './dataverse/IDataverseClient.js';
export { PptbDataverseClient } from './dataverse/PptbDataverseClient.js';

// Discovery Services
export { PublisherDiscovery } from './discovery/PublisherDiscovery.js';
export { SolutionDiscovery } from './discovery/SolutionDiscovery.js';
export { EntityDiscovery } from './discovery/EntityDiscovery.js';
export { SolutionComponentDiscovery } from './discovery/SolutionComponentDiscovery.js';
export { SchemaDiscovery } from './discovery/SchemaDiscovery.js';
export { PluginDiscovery } from './discovery/PluginDiscovery.js';
export { FlowDiscovery } from './discovery/FlowDiscovery.js';
export { BusinessRuleDiscovery } from './discovery/BusinessRuleDiscovery.js';
export { FormDiscovery } from './discovery/FormDiscovery.js';
export { ClassicWorkflowDiscovery } from './discovery/ClassicWorkflowDiscovery.js';
export { BusinessProcessFlowDiscovery } from './discovery/BusinessProcessFlowDiscovery.js';
export { CustomAPIDiscovery } from './discovery/CustomAPIDiscovery.js';
export { EnvironmentVariableDiscovery } from './discovery/EnvironmentVariableDiscovery.js';
export { ConnectionReferenceDiscovery } from './discovery/ConnectionReferenceDiscovery.js';
export { GlobalChoiceDiscovery } from './discovery/GlobalChoiceDiscovery.js';
export { CustomConnectorDiscovery } from './discovery/CustomConnectorDiscovery.js';
export { FieldSecurityProfileDiscovery } from './discovery/FieldSecurityProfileDiscovery.js';
export type {
  FieldSecurityProfile,
  FieldPermission,
  EntityFieldSecurity,
  SecuredField,
  FieldSecurityProfilePermission,
} from './discovery/FieldSecurityProfileDiscovery.js';
export { SecurityRoleDiscovery } from './discovery/SecurityRoleDiscovery.js';
export type {
  SecurityRole,
  RolePrivilege,
  PrivilegeDetail,
  EntityPermission,
  SecurityRoleDetail,
  SpecialPermissions,
  EntitySecurityAccess,
} from './discovery/SecurityRoleDiscovery.js';
export { ColumnSecurityDiscovery } from './discovery/ColumnSecurityDiscovery.js';
export type {
  AttributeMaskingRule,
  ColumnSecurityProfile,
  ColumnPermission,
} from './discovery/ColumnSecurityDiscovery.js';

// Generators
export { BlueprintGenerator } from './generators/BlueprintGenerator.js';
export type { ScopeSelection as BlueprintScope } from './generators/BlueprintGenerator.js';

// Analyzers
export { ExecutionOrderCalculator } from './analyzers/ExecutionOrderCalculator.js';
export { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
export { WorkflowMigrationAnalyzer } from './analyzers/WorkflowMigrationAnalyzer.js';

// Reporters
export { HtmlReporter } from './reporters/HtmlReporter.js';
export { JsonReporter } from './reporters/JsonReporter.js';
export { MarkdownReporter } from './reporters/MarkdownReporter.js';

// Exporters
export { ZipPackager } from './exporters/ZipPackager.js';

// Utils
export { filterSystemFields, isSystemField } from './utils/fieldFilters.js';
export { generatePublisherColor, getPublisherColors } from './utils/ColorGenerator.js';
export type { PublisherColors } from './utils/ColorGenerator.js';
