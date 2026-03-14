import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { ComponentInventoryWithSolutions, WorkflowInventory } from '../../types/components.js';
import type { EntityMetadata } from '../../types.js';

/**
 * All inputs available to every processor step during blueprint generation.
 *
 * Each step receives the full context; individual steps only read what they need.
 * Outputs are written to the mutable BlueprintAccumulator.
 */
export interface ProcessorContext {
  /** Authenticated Dataverse client */
  client: IDataverseClient;
  /** Component ID inventory resolved during discovery */
  inventory: ComponentInventoryWithSolutions;
  /** Classified workflow IDs */
  workflowInventory: WorkflowInventory;
  /** All entities in scope (metadata only, no schema yet) */
  entities: EntityMetadata[];
  /** Abort signal — steps should check this between operations */
  signal: AbortSignal | undefined;
  /** Progress reporter — call to update the UI progress bar */
  onProgress: (progress: ProgressInfo) => void;
  /** Accumulated step warnings (push to append) */
  stepWarnings: StepWarning[];
  /** Fetch logger for audit trail */
  logger: FetchLogger;
  /** Mutable accumulator — steps write their results here */
  acc: BlueprintAccumulator;
}

/**
 * Mutable object that accumulates processor outputs during the generation pipeline.
 * Initialised with empty values before the first step runs.
 */
export interface BlueprintAccumulator {
  plugins: import('../../types.js').PluginStep[];
  pluginsByEntity: Map<string, import('../../types.js').PluginStep[]>;
  flows: import('../../types/blueprint.js').Flow[];
  flowsByEntity: Map<string, import('../../types/blueprint.js').Flow[]>;
  businessRules: import('../../types/blueprint.js').BusinessRule[];
  businessRulesByEntity: Map<string, import('../../types/blueprint.js').BusinessRule[]>;
  classicWorkflows: import('../../types/classicWorkflow.js').ClassicWorkflow[];
  classicWorkflowsByEntity: Map<string, import('../../types/classicWorkflow.js').ClassicWorkflow[]>;
  businessProcessFlows: import('../../types/businessProcessFlow.js').BusinessProcessFlow[];
  businessProcessFlowsByEntity: Map<string, import('../../types/businessProcessFlow.js').BusinessProcessFlow[]>;
  customAPIs: import('../../types/customApi.js').CustomAPI[];
  environmentVariables: import('../../types/environmentVariable.js').EnvironmentVariable[];
  connectionReferences: import('../../types/connectionReference.js').ConnectionReference[];
  globalChoices: import('../../types/globalChoice.js').GlobalChoice[];
  customConnectors: import('../../types/customConnector.js').CustomConnector[];
  securityRoles: import('../../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail[];
  fieldSecurityProfiles: import('../../discovery/FieldSecurityProfileDiscovery.js').FieldSecurityProfile[];
  fieldSecurityByEntity: Map<string, import('../../discovery/FieldSecurityProfileDiscovery.js').EntityFieldSecurity>;
  attributeMaskingRules: import('../../discovery/ColumnSecurityDiscovery.js').AttributeMaskingRule[];
  columnSecurityProfiles: import('../../discovery/ColumnSecurityDiscovery.js').ColumnSecurityProfile[];
  canvasApps: import('../../types/canvasApp.js').CanvasApp[];
  customPages: import('../../types/customPage.js').CustomPage[];
  modelDrivenApps: import('../../types/modelDrivenApp.js').ModelDrivenApp[];
  webResources: import('../../types/blueprint.js').WebResource[];
  webResourcesByType: Map<string, import('../../types/blueprint.js').WebResource[]>;
  forms: import('../../types/blueprint.js').FormDefinition[];
  formsByEntity: Map<string, import('../../types/blueprint.js').FormDefinition[]>;
  /** Warnings accumulated across all steps for the caller */
  warnings: string[];
}

/**
 * A single named step in the blueprint generation pipeline.
 *
 * Each step receives the full ProcessorContext and writes its results into
 * context.acc. Steps must not throw — they should catch errors internally
 * and push to context.stepWarnings.
 */
export interface ProcessorStep {
  /** Human-readable name shown in progress messages */
  readonly name: string;
  /** Execute this step. Must not throw. */
  run(context: ProcessorContext): Promise<void>;
}

/**
 * Creates a fully-initialised empty accumulator.
 */
export function createAccumulator(): BlueprintAccumulator {
  return {
    plugins: [],
    pluginsByEntity: new Map(),
    flows: [],
    flowsByEntity: new Map(),
    businessRules: [],
    businessRulesByEntity: new Map(),
    classicWorkflows: [],
    classicWorkflowsByEntity: new Map(),
    businessProcessFlows: [],
    businessProcessFlowsByEntity: new Map(),
    customAPIs: [],
    environmentVariables: [],
    connectionReferences: [],
    globalChoices: [],
    customConnectors: [],
    securityRoles: [],
    fieldSecurityProfiles: [],
    fieldSecurityByEntity: new Map(),
    attributeMaskingRules: [],
    columnSecurityProfiles: [],
    canvasApps: [],
    customPages: [],
    modelDrivenApps: [],
    webResources: [],
    webResourcesByType: new Map(),
    forms: [],
    formsByEntity: new Map(),
    warnings: [],
  };
}
