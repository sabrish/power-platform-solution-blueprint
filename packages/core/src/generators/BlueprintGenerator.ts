import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import { EntityDiscovery } from '../discovery/EntityDiscovery.js';
import { SolutionComponentDiscovery } from '../discovery/SolutionComponentDiscovery.js';
import { SchemaDiscovery } from '../discovery/SchemaDiscovery.js';
import { PluginDiscovery } from '../discovery/PluginDiscovery.js';
import { FlowDiscovery } from '../discovery/FlowDiscovery.js';
import { BusinessRuleDiscovery } from '../discovery/BusinessRuleDiscovery.js';
import { ClassicWorkflowDiscovery } from '../discovery/ClassicWorkflowDiscovery.js';
import { FormDiscovery } from '../discovery/FormDiscovery.js';
import { WebResourceDiscovery } from '../discovery/WebResourceDiscovery.js';
import { WorkflowMigrationAnalyzer } from '../analyzers/WorkflowMigrationAnalyzer.js';
import { filterSystemFields } from '../utils/fieldFilters.js';
import type { EntityMetadata, PluginStep } from '../types.js';
import type { ComponentInventory, WorkflowInventory } from '../types/components.js';
import type {
  GeneratorOptions,
  BlueprintResult,
  EntityBlueprint,
  ProgressInfo,
  Flow,
  BusinessRule,
  WebResource,
} from '../types/blueprint.js';

/**
 * Scope selection for blueprint generation
 */
export interface ScopeSelection {
  type: 'publisher' | 'solution';
  publisherPrefixes?: string[];
  solutionIds?: string[];
  includeSystem: boolean;
  excludeSystemFields: boolean;
}

/**
 * Main orchestrator for generating Power Platform system blueprints
 * Uses discovery-first approach: discover what exists, then process only those components
 */
export class BlueprintGenerator {
  private readonly client: IDataverseClient;
  private readonly options: GeneratorOptions;
  private readonly scope: ScopeSelection;

  constructor(client: IDataverseClient, scope: ScopeSelection, options: GeneratorOptions) {
    this.client = client;
    this.scope = scope;
    this.options = options;
  }

  /**
   * Generate complete blueprint for the selected scope
   */
  async generate(): Promise<BlueprintResult> {
    const startTime = new Date();
    const warnings: string[] = [];

    try {
      // STEP 1: Discover Components
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: 0,
        message: 'Discovering components in selected scope...',
      });

      const { inventory, workflowInventory, entities } = await this.discoverComponents();

      // Check if solution is empty
      if (this.isInventoryEmpty(inventory)) {
        warnings.push('No components found in selected scope');
      }

      // Report discovery results
      const discoveryMessage = this.buildDiscoveryMessage(inventory, workflowInventory);
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: 0,
        message: discoveryMessage,
      });

      // STEP 2: Process Entities
      const entityBlueprints = await this.processEntities(entities, inventory.attributeIds);
      if (entities.length === 0) {
        warnings.push('No entities found in selected scope');
      }

      // STEP 3: Process Plugins
      const plugins = await this.processPlugins(inventory.pluginIds);
      const pluginsByEntity = this.groupPluginsByEntity(plugins);

      if (inventory.pluginIds.length === 0) {
        warnings.push('No plugins found');
      }

      // STEP 4: Process Flows
      const flows = await this.processFlows(workflowInventory.flowIds);
      const flowsByEntity = this.groupFlowsByEntity(flows);

      if (workflowInventory.flowIds.length === 0) {
        warnings.push('No flows found');
      }

      // STEP 5: Process Business Rules
      const businessRules = await this.processBusinessRules(workflowInventory.businessRuleIds);
      const businessRulesByEntity = this.groupBusinessRulesByEntity(businessRules);

      if (workflowInventory.businessRuleIds.length === 0) {
        warnings.push('No business rules found');
      }

      // STEP 5.5: Process Classic Workflows (deprecated, requires migration)
      const classicWorkflows = await this.processClassicWorkflows(workflowInventory.classicWorkflowIds);
      const classicWorkflowsByEntity = this.groupClassicWorkflowsByEntity(classicWorkflows);

      if (workflowInventory.classicWorkflowIds.length > 0) {
        warnings.push(`⚠️ ${workflowInventory.classicWorkflowIds.length} classic workflow(s) detected - migration to Power Automate recommended`);
      }

      // STEP 5.6: Process Business Process Flows
      const businessProcessFlows = await this.processBusinessProcessFlows(workflowInventory.businessProcessFlowIds);
      const businessProcessFlowsByEntity = this.groupBusinessProcessFlowsByEntity(businessProcessFlows);

      // STEP 6: Process Web Resources
      const webResources = await this.processWebResources(inventory.webResourceIds);
      const webResourcesByType = this.groupWebResourcesByType(webResources);

      if (inventory.webResourceIds.length === 0) {
        warnings.push('No web resources found');
      }

      // STEP 6.5: Process Custom APIs
      const customAPIs = await this.processCustomAPIs(inventory.customApiIds);

      // STEP 6.6: Process Environment Variables
      const environmentVariables = await this.processEnvironmentVariables(inventory.environmentVariableIds);

      // STEP 6.7: Process Connection References
      const connectionReferences = await this.processConnectionReferences(inventory.connectionReferenceIds);

      // STEP 6.8: Process Global Choices (Option Sets)
      const globalChoices = await this.processGlobalChoices(inventory.globalChoiceIds);

      // STEP 6.9: Process Custom Connectors
      const customConnectors = await this.processCustomConnectors(inventory.customConnectorIds);

      // STEP 7: Process Forms and JavaScript Event Handlers
      const forms = await this.processForms(entities.map((e) => e.LogicalName));
      const formsByEntity = this.groupFormsByEntity(forms);

      // STEP 8: Populate automation in entity blueprints
      for (const blueprint of entityBlueprints) {
        const entityName = blueprint.entity.LogicalName;
        blueprint.plugins = pluginsByEntity.get(entityName) || [];
        blueprint.flows = flowsByEntity.get(entityName) || [];
        blueprint.businessRules = businessRulesByEntity.get(entityName) || [];
        blueprint.forms = formsByEntity.get(entityName) || [];
      }

      // STEP 9: Other components (stubbed for now)
      if (inventory.canvasAppIds.length === 0) {
        warnings.push('No canvas apps found');
      }

      // Generate summary
      const summary = {
        totalEntities: entityBlueprints.length,
        totalPlugins: inventory.pluginIds.length,
        totalFlows: workflowInventory.flowIds.length,
        totalBusinessRules: workflowInventory.businessRuleIds.length,
        totalClassicWorkflows: workflowInventory.classicWorkflowIds.length,
        totalBusinessProcessFlows: workflowInventory.businessProcessFlowIds.length,
        totalCustomAPIs: inventory.customApiIds.length,
        totalEnvironmentVariables: inventory.environmentVariableIds.length,
        totalConnectionReferences: inventory.connectionReferenceIds.length,
        totalGlobalChoices: inventory.globalChoiceIds.length,
        totalCustomConnectors: inventory.customConnectorIds.length,
        totalAttributes: entityBlueprints.reduce((sum, bp) => sum + (bp.entity.Attributes?.length || 0), 0),
        totalWebResources: inventory.webResourceIds.length,
        totalCanvasApps: inventory.canvasAppIds.length,
        totalCustomPages: inventory.customPageIds.length,
      };

      // Complete
      this.reportProgress({
        phase: 'complete',
        entityName: '',
        current: entities.length,
        total: entities.length,
        message: 'Blueprint generation complete!',
      });

      return {
        metadata: {
          generatedAt: startTime,
          environment: 'current',
          scope: {
            type: this.scope.type,
            description: this.getScopeDescription(),
          },
          entityCount: entities.length,
        },
        entities: entityBlueprints,
        summary,
        plugins,
        pluginsByEntity,
        flows,
        flowsByEntity,
        businessRules,
        businessRulesByEntity,
        classicWorkflows,
        classicWorkflowsByEntity,
        businessProcessFlows,
        businessProcessFlowsByEntity,
        customAPIs,
        environmentVariables,
        connectionReferences,
        globalChoices,
        customConnectors,
        webResources,
        webResourcesByType,
      };
    } catch (error) {
      throw new Error(
        `Blueprint generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Discover all components in the selected scope
   */
  private async discoverComponents(): Promise<{
    inventory: ComponentInventory;
    workflowInventory: WorkflowInventory;
    entities: EntityMetadata[];
  }> {
    const entityDiscovery = new EntityDiscovery(this.client);

    if (this.scope.type === 'solution' && this.scope.solutionIds) {
      // Solution-based discovery
      const componentDiscovery = new SolutionComponentDiscovery(this.client);

      // Discover all component types
      const inventory = await componentDiscovery.discoverComponents(this.scope.solutionIds);

      // Classify workflows
      const workflowInventory = await componentDiscovery.classifyWorkflows(inventory.workflowIds);

      // Get entity metadata for discovered entities
      const entities = await entityDiscovery.getEntitiesByIds(inventory.entityIds);

      return { inventory, workflowInventory, entities };
    } else if (this.scope.type === 'publisher' && this.scope.publisherPrefixes) {
      // Publisher-based discovery
      const entities = await entityDiscovery.getEntitiesByPublisher(this.scope.publisherPrefixes);

      // For publisher-based, we don't have component inventory
      // Return empty inventory (no attribute filtering for publisher-based)
      const inventory: ComponentInventory = {
        entityIds: entities.map(e => e.MetadataId),
        attributeIds: [],
        pluginIds: [],
        workflowIds: [],
        webResourceIds: [],
        canvasAppIds: [],
        customPageIds: [],
        connectionReferenceIds: [],
        customApiIds: [],
        environmentVariableIds: [],
        globalChoiceIds: [],
        customConnectorIds: [],
      };

      const workflowInventory: WorkflowInventory = {
        flowIds: [],
        businessRuleIds: [],
        classicWorkflowIds: [],
        businessProcessFlowIds: [],
      };

      return { inventory, workflowInventory, entities };
    }

    throw new Error('Invalid scope configuration');
  }

  /**
   * Process all entities - fetch detailed schema and filter attributes by solution
   */
  private async processEntities(entities: EntityMetadata[], attributeIds: string[]): Promise<EntityBlueprint[]> {
    const blueprints: EntityBlueprint[] = [];
    const total = entities.length;

    for (let i = 0; i < entities.length; i++) {
      // Check if cancelled
      if (this.options.signal?.aborted) {
        throw new Error('Blueprint generation cancelled');
      }

      const entity = entities[i];
      const current = i + 1;
      const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName;

      // Fetch schema
      this.reportProgress({
        phase: 'schema',
        entityName: entity.LogicalName,
        current,
        total,
        message: `Processing ${displayName} (${current}/${total})...`,
      });

      const schemaDiscovery = new SchemaDiscovery(this.client);
      const detailedEntity = await schemaDiscovery.getEntitySchema(entity.LogicalName);

      // For custom entities, all attributes are implicitly included
      // Only filter attributes for system entities
      const isCustomEntity = entity.IsCustomEntity;

      if (detailedEntity.Attributes && !isCustomEntity && attributeIds.length > 0) {
        // Only filter system entity attributes to those in solution
        const originalCount = detailedEntity.Attributes.length;

        detailedEntity.Attributes = detailedEntity.Attributes.filter((attr) => {
          if (!attr.MetadataId) return false;

          // Normalize GUIDs: remove braces and lowercase for comparison
          const normalizedAttrId = this.normalizeGuid(attr.MetadataId);

          // Check if this attribute's ID exists in the solution attribute IDs
          return attributeIds.some(solutionAttrId =>
            this.normalizeGuid(solutionAttrId) === normalizedAttrId
          );
        });

        console.log(
          `📊 ${entity.LogicalName} (system): Filtered ${originalCount} → ${detailedEntity.Attributes.length} attributes`
        );
      } else if (isCustomEntity) {
        console.log(
          `📊 ${entity.LogicalName} (custom): Keeping all ${detailedEntity.Attributes?.length || 0} attributes`
        );
      }

      // Filter system fields if requested
      if (this.scope.excludeSystemFields && detailedEntity.Attributes) {
        detailedEntity.Attributes = filterSystemFields(detailedEntity.Attributes, true);
      }

      blueprints.push({
        entity: detailedEntity,
        plugins: [],
        flows: [],
        businessRules: [],
        forms: [],
      });

      // Small delay to be respectful to API
      await this.delay(100);
    }

    return blueprints;
  }

  /**
   * Check if inventory is completely empty
   */
  private isInventoryEmpty(inventory: ComponentInventory): boolean {
    return (
      inventory.entityIds.length === 0 &&
      inventory.pluginIds.length === 0 &&
      inventory.workflowIds.length === 0 &&
      inventory.webResourceIds.length === 0 &&
      inventory.canvasAppIds.length === 0 &&
      inventory.customPageIds.length === 0 &&
      inventory.connectionReferenceIds.length === 0 &&
      inventory.customApiIds.length === 0 &&
      inventory.environmentVariableIds.length === 0
    );
  }

  /**
   * Build discovery message
   */
  private buildDiscoveryMessage(inventory: ComponentInventory, workflowInventory: WorkflowInventory): string {
    const parts: string[] = [];

    if (inventory.entityIds.length > 0) {
      parts.push(`${inventory.entityIds.length} entities`);
    }
    if (inventory.pluginIds.length > 0) {
      parts.push(`${inventory.pluginIds.length} plugins`);
    }
    if (workflowInventory.flowIds.length > 0) {
      parts.push(`${workflowInventory.flowIds.length} flows`);
    }
    if (workflowInventory.businessRuleIds.length > 0) {
      parts.push(`${workflowInventory.businessRuleIds.length} business rules`);
    }
    if (inventory.webResourceIds.length > 0) {
      parts.push(`${inventory.webResourceIds.length} web resources`);
    }
    if (inventory.canvasAppIds.length > 0) {
      parts.push(`${inventory.canvasAppIds.length} canvas apps`);
    }

    if (parts.length === 0) {
      return 'No components found in selected scope';
    }

    return `Found: ${parts.join(', ')}`;
  }

  /**
   * Get human-readable scope description
   */
  private getScopeDescription(): string {
    if (this.scope.type === 'publisher' && this.scope.publisherPrefixes) {
      return `Publishers: ${this.scope.publisherPrefixes.join(', ')}`;
    } else if (this.scope.type === 'solution' && this.scope.solutionIds) {
      return `Solutions: ${this.scope.solutionIds.length} selected`;
    }
    return 'Unknown scope';
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: ProgressInfo): void {
    if (this.options.onProgress) {
      this.options.onProgress(progress);
    }
  }

  /**
   * Process plugins - fetch detailed plugin metadata
   */
  private async processPlugins(pluginIds: string[]): Promise<PluginStep[]> {
    console.log(`🔌 processPlugins called with ${pluginIds.length} plugin IDs:`, pluginIds);

    if (pluginIds.length === 0) {
      console.log('🔌 No plugins to process, returning empty array');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'plugins',
        entityName: '',
        current: 0,
        total: pluginIds.length,
        message: `Documenting ${pluginIds.length} plugin${pluginIds.length > 1 ? 's' : ''}...`,
      });

      const pluginDiscovery = new PluginDiscovery(this.client);
      const plugins = await pluginDiscovery.getPluginsByIds(pluginIds);

      console.log(`🔌 Successfully retrieved ${plugins.length} plugin(s)`);

      // Report completion
      this.reportProgress({
        phase: 'plugins',
        entityName: '',
        current: plugins.length,
        total: plugins.length,
        message: 'Plugins documented',
      });

      return plugins;
    } catch (error) {
      console.error('🔌 ERROR processing plugins:', error);
      throw error;
    }
  }

  /**
   * Process flows - fetch detailed flow metadata
   */
  private async processFlows(flowIds: string[]): Promise<Flow[]> {
    console.log(`🌊 processFlows called with ${flowIds.length} flow IDs:`, flowIds);

    if (flowIds.length === 0) {
      console.log('🌊 No flows to process, returning empty array');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'flows',
        entityName: '',
        current: 0,
        total: flowIds.length,
        message: `Documenting ${flowIds.length} flow${flowIds.length > 1 ? 's' : ''}...`,
      });

      const flowDiscovery = new FlowDiscovery(this.client);
      const flows = await flowDiscovery.getFlowsByIds(flowIds);

      console.log(`🌊 Successfully retrieved ${flows.length} flow(s)`);

      // Report completion
      this.reportProgress({
        phase: 'flows',
        entityName: '',
        current: flows.length,
        total: flows.length,
        message: 'Flows documented',
      });

      return flows;
    } catch (error) {
      console.error('🌊 ERROR processing flows:', error);
      throw error;
    }
  }

  /**
   * Group flows by entity for entity-specific views
   */
  private groupFlowsByEntity(flows: Flow[]): Map<string, Flow[]> {
    const flowsByEntity = new Map<string, Flow[]>();

    for (const flow of flows) {
      if (!flow.entity) {
        // Flows without an entity go in a special "global" bucket
        continue;
      }

      const entity = flow.entity.toLowerCase();
      if (!flowsByEntity.has(entity)) {
        flowsByEntity.set(entity, []);
      }
      flowsByEntity.get(entity)!.push(flow);
    }

    // Sort flows within each entity by name
    for (const [, entityFlows] of flowsByEntity) {
      entityFlows.sort((a, b) => a.name.localeCompare(b.name));
    }

    return flowsByEntity;
  }

  /**
   * Group plugins by entity for entity-specific views
   */
  private groupPluginsByEntity(plugins: PluginStep[]): Map<string, PluginStep[]> {
    const pluginsByEntity = new Map<string, PluginStep[]>();

    for (const plugin of plugins) {
      const entity = plugin.entity.toLowerCase();
      if (!pluginsByEntity.has(entity)) {
        pluginsByEntity.set(entity, []);
      }
      pluginsByEntity.get(entity)!.push(plugin);
    }

    // Sort plugins within each entity by stage and rank
    for (const [, entityPlugins] of pluginsByEntity) {
      entityPlugins.sort((a, b) => {
        if (a.stage !== b.stage) return a.stage - b.stage;
        return a.rank - b.rank;
      });
    }

    return pluginsByEntity;
  }

  /**
   * Process business rules - fetch detailed business rule metadata
   */
  private async processBusinessRules(businessRuleIds: string[]): Promise<BusinessRule[]> {
    console.log(`📋 processBusinessRules called with ${businessRuleIds.length} business rule IDs`);

    if (businessRuleIds.length === 0) {
      console.log('📋 No business rules to process, returning empty array');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'business-rules',
        entityName: '',
        current: 0,
        total: businessRuleIds.length,
        message: `Documenting ${businessRuleIds.length} business rule${businessRuleIds.length > 1 ? 's' : ''}...`,
      });

      const businessRuleDiscovery = new BusinessRuleDiscovery(this.client);
      const businessRules = await businessRuleDiscovery.getBusinessRulesByIds(businessRuleIds);

      console.log(`📋 Successfully retrieved ${businessRules.length} business rule(s)`);

      // Report completion
      this.reportProgress({
        phase: 'business-rules',
        entityName: '',
        current: businessRules.length,
        total: businessRules.length,
        message: 'Business rules documented',
      });

      return businessRules;
    } catch (error) {
      console.error('📋 ERROR processing business rules:', error);
      throw error;
    }
  }

  /**
   * Process web resources - fetch and analyze web resource content
   */
  private async processWebResources(webResourceIds: string[]): Promise<WebResource[]> {
    console.log(`📦 processWebResources called with ${webResourceIds.length} web resource IDs`);

    if (webResourceIds.length === 0) {
      console.log('📦 No web resources to process, returning empty array');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: webResourceIds.length,
        message: `Analyzing ${webResourceIds.length} web resource${webResourceIds.length > 1 ? 's' : ''}...`,
      });

      const webResourceDiscovery = new WebResourceDiscovery(this.client);
      const webResources = await webResourceDiscovery.getWebResourcesByIds(webResourceIds);

      console.log(`📦 Successfully retrieved ${webResources.length} web resource(s)`);

      // Report completion
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: webResources.length,
        total: webResources.length,
        message: 'Web resources analyzed',
      });

      return webResources;
    } catch (error) {
      console.error('📦 ERROR processing web resources:', error);
      throw error;
    }
  }

  /**
   * Group business rules by entity
   */
  private groupBusinessRulesByEntity(businessRules: BusinessRule[]): Map<string, BusinessRule[]> {
    const businessRulesByEntity = new Map<string, BusinessRule[]>();

    for (const rule of businessRules) {
      const entity = rule.entity.toLowerCase();
      if (!businessRulesByEntity.has(entity)) {
        businessRulesByEntity.set(entity, []);
      }
      businessRulesByEntity.get(entity)!.push(rule);
    }

    // Sort business rules within each entity by name
    for (const [, entityRules] of businessRulesByEntity) {
      entityRules.sort((a, b) => a.name.localeCompare(b.name));
    }

    return businessRulesByEntity;
  }

  /**
   * Process classic workflows (deprecated, requires migration)
   */
  private async processClassicWorkflows(workflowIds: string[]): Promise<import('../types/classicWorkflow.js').ClassicWorkflow[]> {
    console.log(`⚠️ processClassicWorkflows called with ${workflowIds.length} classic workflow IDs`);

    if (workflowIds.length === 0) {
      console.log('⚠️ No classic workflows to process');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: workflowIds.length,
        message: `⚠️ Documenting ${workflowIds.length} classic workflow(s) (migration recommended)...`,
      });

      const classicWorkflowDiscovery = new ClassicWorkflowDiscovery(this.client);
      const workflows = await classicWorkflowDiscovery.getClassicWorkflowsByIds(workflowIds);

      // Analyze each workflow for migration
      const analyzer = new WorkflowMigrationAnalyzer();
      for (const workflow of workflows) {
        workflow.migrationRecommendation = analyzer.analyze(workflow);
      }

      console.log(`⚠️ Successfully retrieved and analyzed ${workflows.length} classic workflow(s)`);

      // Report completion
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: workflows.length,
        total: workflows.length,
        message: 'Classic workflows documented with migration recommendations',
      });

      return workflows;
    } catch (error) {
      console.error('❌ Error processing classic workflows:', error);
      // Don't fail the entire generation if classic workflows fail
      return [];
    }
  }

  /**
   * Group classic workflows by entity
   */
  private groupClassicWorkflowsByEntity(workflows: import('../types/classicWorkflow.js').ClassicWorkflow[]): Map<string, import('../types/classicWorkflow.js').ClassicWorkflow[]> {
    const workflowsByEntity = new Map<string, import('../types/classicWorkflow.js').ClassicWorkflow[]>();

    for (const workflow of workflows) {
      const entity = workflow.entity.toLowerCase();
      if (!workflowsByEntity.has(entity)) {
        workflowsByEntity.set(entity, []);
      }
      workflowsByEntity.get(entity)!.push(workflow);
    }

    // Sort workflows within each entity by name
    for (const [, entityWorkflows] of workflowsByEntity) {
      entityWorkflows.sort((a, b) => a.name.localeCompare(b.name));
    }

    return workflowsByEntity;
  }

  /**
   * Process Business Process Flows
   */
  private async processBusinessProcessFlows(workflowIds: string[]): Promise<import('../types/businessProcessFlow.js').BusinessProcessFlow[]> {
    console.log(`📊 processBusinessProcessFlows called with ${workflowIds.length} BPF IDs`);

    if (workflowIds.length === 0) {
      console.log('📊 No Business Process Flows to process');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: workflowIds.length,
        message: `📊 Documenting ${workflowIds.length} Business Process Flow(s)...`,
      });

      const { BusinessProcessFlowDiscovery } = await import('../discovery/BusinessProcessFlowDiscovery.js');
      const bpfDiscovery = new BusinessProcessFlowDiscovery(this.client);
      const bpfs = await bpfDiscovery.getBusinessProcessFlowsByIds(workflowIds);

      console.log(`📊 Successfully retrieved ${bpfs.length} Business Process Flow(s)`);

      // Report completion
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: workflowIds.length,
        total: workflowIds.length,
        message: `📊 Documented ${bpfs.length} Business Process Flow(s)`,
      });

      return bpfs;
    } catch (error) {
      console.error('❌ Error processing Business Process Flows:', error);
      throw error;
    }
  }

  /**
   * Group Business Process Flows by primary entity
   */
  private groupBusinessProcessFlowsByEntity(bpfs: import('../types/businessProcessFlow.js').BusinessProcessFlow[]): Map<string, import('../types/businessProcessFlow.js').BusinessProcessFlow[]> {
    const bpfsByEntity = new Map<string, import('../types/businessProcessFlow.js').BusinessProcessFlow[]>();

    for (const bpf of bpfs) {
      const entity = bpf.primaryEntity.toLowerCase();
      if (!bpfsByEntity.has(entity)) {
        bpfsByEntity.set(entity, []);
      }
      bpfsByEntity.get(entity)!.push(bpf);
    }

    // Sort BPFs within each entity by name
    for (const [, entityBpfs] of bpfsByEntity) {
      entityBpfs.sort((a, b) => a.name.localeCompare(b.name));
    }

    return bpfsByEntity;
  }

  /**
   * Process Custom APIs
   */
  private async processCustomAPIs(customApiIds: string[]): Promise<import('../types/customApi.js').CustomAPI[]> {
    console.log(`🔧 processCustomAPIs called with ${customApiIds.length} Custom API IDs`);

    if (customApiIds.length === 0) {
      console.log('🔧 No Custom APIs to process');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: customApiIds.length,
        message: `🔧 Documenting ${customApiIds.length} Custom API(s)...`,
      });

      const { CustomAPIDiscovery } = await import('../discovery/CustomAPIDiscovery.js');
      const customApiDiscovery = new CustomAPIDiscovery(this.client);
      const customAPIs = await customApiDiscovery.getCustomAPIsByIds(customApiIds);

      console.log(`🔧 Successfully retrieved ${customAPIs.length} Custom API(s)`);

      // Report completion
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: customApiIds.length,
        total: customApiIds.length,
        message: `🔧 Documented ${customAPIs.length} Custom API(s)`,
      });

      return customAPIs;
    } catch (error) {
      console.error('❌ Error processing Custom APIs:', error);
      throw error;
    }
  }

  /**
   * Process Environment Variables
   */
  private async processEnvironmentVariables(envVarIds: string[]): Promise<import('../types/environmentVariable.js').EnvironmentVariable[]> {
    console.log(`🌍 processEnvironmentVariables called with ${envVarIds.length} Environment Variable IDs`);

    if (envVarIds.length === 0) {
      console.log('🌍 No Environment Variables to process');
      return [];
    }

    try {
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: envVarIds.length,
        message: `🌍 Documenting ${envVarIds.length} Environment Variable(s)...`,
      });

      const { EnvironmentVariableDiscovery } = await import('../discovery/EnvironmentVariableDiscovery.js');
      const envVarDiscovery = new EnvironmentVariableDiscovery(this.client);
      const envVars = await envVarDiscovery.getEnvironmentVariablesByIds(envVarIds);

      console.log(`🌍 Successfully retrieved ${envVars.length} Environment Variable(s)`);

      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: envVarIds.length,
        total: envVarIds.length,
        message: `🌍 Documented ${envVars.length} Environment Variable(s)`,
      });

      return envVars;
    } catch (error) {
      console.error('❌ Error processing Environment Variables:', error);
      throw error;
    }
  }

  private async processConnectionReferences(connRefIds: string[]): Promise<import('../types/connectionReference.js').ConnectionReference[]> {
    if (connRefIds.length === 0) return [];
    try {
      this.reportProgress({ phase: 'discovering', entityName: '', current: 0, total: connRefIds.length,
        message: `🔗 Documenting ${connRefIds.length} Connection Reference(s)...` });
      const { ConnectionReferenceDiscovery } = await import('../discovery/ConnectionReferenceDiscovery.js');
      const discovery = new ConnectionReferenceDiscovery(this.client);
      const refs = await discovery.getConnectionReferencesByIds(connRefIds);
      return refs;
    } catch (error) {
      console.error('❌ Error processing Connection References:', error);
      throw error;
    }
  }

  private async processGlobalChoices(globalChoiceIds: string[]): Promise<import('../types/globalChoice.js').GlobalChoice[]> {
    if (globalChoiceIds.length === 0) return [];
    try {
      this.reportProgress({ phase: 'discovering', entityName: '', current: 0, total: globalChoiceIds.length,
        message: `📋 Documenting ${globalChoiceIds.length} Global Choice(s)...` });
      const { GlobalChoiceDiscovery } = await import('../discovery/GlobalChoiceDiscovery.js');
      const discovery = new GlobalChoiceDiscovery(this.client);
      const choices = await discovery.discoverGlobalChoices(globalChoiceIds);
      return choices;
    } catch (error) {
      console.error('❌ Error processing Global Choices:', error);
      throw error;
    }
  }

  private async processCustomConnectors(connectorIds: string[]): Promise<import('../types/customConnector.js').CustomConnector[]> {
    if (connectorIds.length === 0) return [];
    try {
      this.reportProgress({ phase: 'discovering', entityName: '', current: 0, total: connectorIds.length,
        message: `🔌 Documenting ${connectorIds.length} Custom Connector(s)...` });
      const { CustomConnectorDiscovery } = await import('../discovery/CustomConnectorDiscovery.js');
      const discovery = new CustomConnectorDiscovery(this.client);
      const connectors = await discovery.getConnectorsByIds(connectorIds);
      return connectors;
    } catch (error) {
      console.error('❌ Error processing Custom Connectors:', error);
      throw error;
    }
  }

  /**
   * Process forms and JavaScript event handlers
   */
  private async processForms(entityNames: string[]): Promise<import('../types/blueprint.js').FormDefinition[]> {
    console.log(`📋 processForms called for ${entityNames.length} entities`);

    if (entityNames.length === 0) {
      console.log('📋 No entities to process forms for, returning empty array');
      return [];
    }

    try {
      // Report progress
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: entityNames.length,
        message: `Discovering forms and JavaScript handlers...`,
      });

      const formDiscovery = new FormDiscovery(this.client);
      const forms = await formDiscovery.getFormsForEntities(entityNames);

      console.log(`📋 Successfully retrieved ${forms.length} form(s) with event handlers`);

      // Report completion
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: forms.length,
        total: forms.length,
        message: 'Forms and JavaScript handlers discovered',
      });

      return forms;
    } catch (error) {
      console.error('❌ Error processing forms:', error);
      // Don't fail the entire generation if forms fail
      return [];
    }
  }

  /**
   * Group forms by entity
   */
  private groupFormsByEntity(forms: import('../types/blueprint.js').FormDefinition[]): Map<string, import('../types/blueprint.js').FormDefinition[]> {
    const formsByEntity = new Map<string, import('../types/blueprint.js').FormDefinition[]>();

    for (const form of forms) {
      const entity = form.entity.toLowerCase();
      if (!formsByEntity.has(entity)) {
        formsByEntity.set(entity, []);
      }
      formsByEntity.get(entity)!.push(form);
    }

    // Sort forms within each entity by name
    for (const [, entityForms] of formsByEntity) {
      entityForms.sort((a, b) => a.name.localeCompare(b.name));
    }

    return formsByEntity;
  }

  /**
   * Group web resources by type
   */
  private groupWebResourcesByType(webResources: WebResource[]): Map<string, WebResource[]> {
    const webResourcesByType = new Map<string, WebResource[]>();

    for (const resource of webResources) {
      const type = resource.typeName;
      if (!webResourcesByType.has(type)) {
        webResourcesByType.set(type, []);
      }
      webResourcesByType.get(type)!.push(resource);
    }

    // Sort web resources within each type by name
    for (const [, typeResources] of webResourcesByType) {
      typeResources.sort((a, b) => a.name.localeCompare(b.name));
    }

    return webResourcesByType;
  }

  /**
   * Normalize GUID for comparison (remove braces, lowercase)
   */
  private normalizeGuid(guid: string): string {
    return guid.toLowerCase().replace(/[{}]/g, '');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
