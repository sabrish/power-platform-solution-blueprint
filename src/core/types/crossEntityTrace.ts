/**
 * Cross-Entity Automation Trace types for PPSB
 *
 * These types model the 4-layer analysis that traces automation chains
 * across entity boundaries:
 *   Layer 1 — Discovery (entity blueprints, raw data)
 *   Layer 2 — Entry Points (which automations on other entities write to THIS entity)
 *   Layer 3 — Activation Map (which of THIS entity's automations fire for each entry point)
 *   Layer 4 — Risk Detection (performance, circular ref, deep sync chain)
 */

/** Entry point: one automation on another entity that writes to this entity */
export interface CrossEntityEntryPoint {
  automationType: 'Flow' | 'ClassicWorkflow';
  automationName: string;
  automationId: string;
  /** Entity the automation lives on */
  sourceEntity: string;
  sourceEntityDisplayName: string;
  operation: 'Create' | 'Update' | 'Delete';
  /** Fields being set (empty = unknown) */
  fields: string[];
  isAsynchronous: boolean;
  /** For scheduled flows */
  isScheduled: boolean;
  /** For on-demand classic workflows */
  isOnDemand: boolean;
  confidence: 'High' | 'Medium' | 'Low';
}

/** How one registered automation responds to a specific entry point */
export interface AutomationActivation {
  automationType: 'Plugin' | 'Flow' | 'BusinessRule' | 'ClassicWorkflow';
  automationId: string;
  automationName: string;
  stage?: number;
  stageName?: string;
  rank?: number;
  mode: 'Sync' | 'Async';
  firingStatus: 'WillFire' | 'WontFire' | 'WillFireNoFilter';
  /** Fields from the entry point that triggered this activation */
  matchedFields: string[];
  /** Registered filtering attributes (empty = no filter = fires on all updates) */
  filteringAttributes: string[];
  /** If this automation writes to another entity: the downstream branch */
  downstream?: CrossEntityBranch;
}

/** A branch to another entity's pipeline, triggered by an activation */
export interface CrossEntityBranch {
  targetEntity: string;
  targetEntityDisplayName: string;
  operation: 'Create' | 'Update' | 'Delete';
  fields: string[];
  /** Key into CrossEntityAnalysisResult.entityViews to avoid duplication */
  pipelineRef: string;
}

/** Full trace for one entry point into one target entity */
export interface CrossEntityTrace {
  entryPoint: CrossEntityEntryPoint;
  /** ALL registered automations with fire/won't-fire status */
  activations: AutomationActivation[];
  risks: CrossEntityRisk[];
}

/** Per-entity view: all entry points discovered for this entity */
export interface CrossEntityEntityView {
  entityLogicalName: string;
  entityDisplayName: string;
  /** One trace per entry point */
  traces: CrossEntityTrace[];
}

/** Risk detected in the automation chain */
export interface CrossEntityRisk {
  type: 'NoFilterAttributes' | 'CircularReference' | 'DeepSyncChain' | 'HighFanOut' | 'ReTrigger';
  severity: 'High' | 'Medium';
  description: string;
  automationName?: string;
}

/** A single automation step in an entity's pipeline — without entry-point context */
export interface PipelineStep {
  automationType: 'Plugin' | 'Flow' | 'BusinessRule' | 'ClassicWorkflow';
  automationId: string;
  automationName: string;
  stage?: number;
  stageName?: string;
  rank?: number;
  mode: 'Sync' | 'Async';
  /** Filtering attributes registered on this automation (empty = no filter) */
  filteringAttributes: string[];
  /** True when this is an Update-message step with empty filteringAttributes — performance risk */
  firesForAllUpdates: boolean;
  /** If this automation writes to another entity */
  downstream?: CrossEntityBranch;
  /** True if this flow makes any external HTTP/connector calls */
  hasExternalCalls?: boolean;
}

/** All steps for one Dataverse message (Create / Update / Delete) on an entity */
export interface MessagePipeline {
  message: 'Create' | 'Update' | 'Delete';
  /** Steps sorted: stage ASC → rank ASC → Sync before Async */
  steps: PipelineStep[];
}

/** Full pipeline view for one entity — covers ALL entities with automation, not just cross-entity targets */
export interface EntityAutomationPipeline {
  entityLogicalName: string;
  entityDisplayName: string;
  /** One entry per message that has at least one registered automation */
  messagePipelines: MessagePipeline[];
  /** Entry points from other entities that write to this entity */
  inboundEntryPoints: CrossEntityEntryPoint[];
  hasCrossEntityOutput: boolean;
  hasCrossEntityInput: boolean;
}

/** Top-level result of the cross-entity analysis */
export interface CrossEntityAnalysisResult {
  /** Keyed by entity logical name; only entities that have entry points */
  entityViews: Map<string, CrossEntityEntityView>;
  /** Flat chain map for the global overview */
  chainLinks: CrossEntityChainLink[];
  totalEntryPoints: number;
  totalBranches: number;
  risks: CrossEntityRisk[];
  /** All blueprint entities that have any automation — superset of entityViews */
  allEntityPipelines: Map<string, EntityAutomationPipeline>;
  /** Count of plugins with no filteringAttributes that fire on ALL updates */
  noFilterPluginCount: number;
}

/** One edge in the global chain map */
export interface CrossEntityChainLink {
  sourceEntity: string;
  sourceEntityDisplayName: string;
  targetEntity: string;
  targetEntityDisplayName: string;
  automationName: string;
  automationType: 'Flow' | 'ClassicWorkflow';
  operation: 'Create' | 'Update' | 'Delete';
  isAsynchronous: boolean;
}
