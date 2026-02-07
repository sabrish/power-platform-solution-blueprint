// Types
export type { Publisher, Solution, EntityMetadata, PluginStep, ImageDefinition } from './types.js';
export { STAGE_COLORS } from './types.js';
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

// Generators
export { BlueprintGenerator } from './generators/BlueprintGenerator.js';
export type { ScopeSelection as BlueprintScope } from './generators/BlueprintGenerator.js';

// Analyzers
export { ExecutionOrderCalculator } from './analyzers/ExecutionOrderCalculator.js';
export { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';

// Utils
export { filterSystemFields, isSystemField } from './utils/fieldFilters.js';
