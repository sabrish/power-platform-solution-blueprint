import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import { EntityDiscovery } from '../discovery/EntityDiscovery.js';
import { SolutionComponentDiscovery } from '../discovery/SolutionComponentDiscovery.js';
import { SolutionDiscovery } from '../discovery/SolutionDiscovery.js';
import { PublisherDiscovery } from '../discovery/PublisherDiscovery.js';
import { SchemaDiscovery } from '../discovery/SchemaDiscovery.js';
import { PluginDiscovery } from '../discovery/PluginDiscovery.js';
import { FlowDiscovery } from '../discovery/FlowDiscovery.js';
import { BusinessRuleDiscovery } from '../discovery/BusinessRuleDiscovery.js';
import { ClassicWorkflowDiscovery } from '../discovery/ClassicWorkflowDiscovery.js';
import { FormDiscovery } from '../discovery/FormDiscovery.js';
import { WebResourceDiscovery } from '../discovery/WebResourceDiscovery.js';
import { WorkflowMigrationAnalyzer } from '../analyzers/WorkflowMigrationAnalyzer.js';
import { ERDGenerator } from '../generators/ERDGenerator.js';
import { CrossEntityMapper } from '../analyzers/CrossEntityMapper.js';
import { ExternalDependencyAggregator } from '../analyzers/ExternalDependencyAggregator.js';
import { SolutionDistributionAnalyzer } from '../analyzers/SolutionDistributionAnalyzer.js';
import { SecurityRoleDiscovery } from '../discovery/SecurityRoleDiscovery.js';
import { FieldSecurityProfileDiscovery } from '../discovery/FieldSecurityProfileDiscovery.js';
import { filterSystemFields } from '../utils/fieldFilters.js';
import type { EntityMetadata, PluginStep, Publisher, Solution } from '../types.js';
import type { ComponentInventory, ComponentInventoryWithSolutions, WorkflowInventory } from '../types/components.js';
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
  private publishers: Publisher[] = [];
  private solutions: Solution[] = [];
  private latestResult: BlueprintResult | null = null;

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

      // STEP 6.10: Process Security Roles
      const securityRoles = await this.processSecurityRoles(inventory.securityRoleIds);

      // STEP 6.11: Process Field Security Profiles
      const { profiles: fieldSecurityProfiles, fieldSecurityByEntity } = await this.processFieldSecurityProfiles(
        inventory.fieldSecurityProfileIds,
        entities.map((e) => e.LogicalName)
      );

      // STEP 6.12: Process Column Security (Attribute Masking & Column Security Profiles)
      const { attributeMaskingRules, columnSecurityProfiles } = await this.processColumnSecurity();

      // STEP 7: Process Forms and JavaScript Event Handlers
      const forms = await this.processForms(entities.map((e) => e.LogicalName), inventory.formIds);
      const formsByEntity = this.groupFormsByEntity(forms);

      // STEP 8: Populate automation and security in entity blueprints
      for (const blueprint of entityBlueprints) {
        const entityName = blueprint.entity.LogicalName;
        blueprint.plugins = pluginsByEntity.get(entityName) || [];
        blueprint.flows = flowsByEntity.get(entityName) || [];
        blueprint.businessRules = businessRulesByEntity.get(entityName) || [];
        blueprint.forms = formsByEntity.get(entityName) || [];

        // Attach field security if it exists for this entity
        const fieldSecurity = fieldSecurityByEntity.get(entityName);
        if (fieldSecurity) {
          blueprint.fieldSecurity = fieldSecurity;
        }
      }

      // STEP 9: Generate ERD and Advanced Analysis
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: 4,
        message: 'Generating ERD and analyzing system architecture...',
      });

      // 10.1: Generate ERD
      const erdGenerator = new ERDGenerator();
      const erd = erdGenerator.generateMermaidERD(entityBlueprints, this.publishers);
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 1,
        total: 4,
        message: 'ERD generated',
      });

      // 10.2: Map cross-entity automation
      const crossEntityMapper = new CrossEntityMapper();
      const crossEntityLinks = crossEntityMapper.mapCrossEntityAutomation(entityBlueprints);
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 2,
        total: 4,
        message: 'Cross-entity automation mapped',
      });

      // 10.3: Aggregate external dependencies
      const externalDependencyAggregator = new ExternalDependencyAggregator();
      const blueprintResultPartial: BlueprintResult = {
        metadata: {
          generatedAt: startTime,
          environment: this.client.getEnvironmentUrl(),
          scope: { type: this.scope.type, description: this.getScopeDescription() },
          entityCount: entities.length,
        },
        entities: entityBlueprints,
        summary: {
          totalEntities: 0,
          totalPlugins: 0,
          totalPluginPackages: 0,
          totalFlows: 0,
          totalBusinessRules: 0,
          totalClassicWorkflows: 0,
          totalBusinessProcessFlows: 0,
          totalCustomAPIs: 0,
          totalEnvironmentVariables: 0,
          totalConnectionReferences: 0,
          totalGlobalChoices: 0,
          totalCustomConnectors: 0,
          totalSecurityRoles: 0,
          totalFieldSecurityProfiles: 0,
          totalAttributeMaskingRules: 0,
          totalColumnSecurityProfiles: 0,
          totalAttributes: 0,
          totalWebResources: 0,
          totalCanvasApps: 0,
          totalCustomPages: 0,
        },
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
      const externalEndpoints = externalDependencyAggregator.aggregateExternalDependencies(blueprintResultPartial);
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 3,
        total: 4,
        message: 'External dependencies aggregated',
      });

      // 10.4: Analyze solution distribution (if solution-based scope)
      let solutionDistribution = undefined;
      if (this.scope.type === 'solution' && this.solutions.length > 0) {
        const solutionDistributionAnalyzer = new SolutionDistributionAnalyzer();
        solutionDistribution = solutionDistributionAnalyzer.analyzeSolutionDistribution(
          this.solutions,
          blueprintResultPartial,
          inventory.solutionComponentMap  // Pass component membership for accurate counting
        );
      }
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 4,
        total: 4,
        message: 'Solution distribution analyzed',
      });

      // Generate summary
      const summary = {
        totalEntities: entityBlueprints.length,
        totalPlugins: inventory.pluginIds.length,
        totalPluginPackages: inventory.pluginPackageIds.length,
        totalFlows: workflowInventory.flowIds.length,
        totalBusinessRules: workflowInventory.businessRuleIds.length,
        totalClassicWorkflows: workflowInventory.classicWorkflowIds.length,
        totalBusinessProcessFlows: workflowInventory.businessProcessFlowIds.length,
        totalCustomAPIs: inventory.customApiIds.length,
        totalEnvironmentVariables: inventory.environmentVariableIds.length,
        totalConnectionReferences: inventory.connectionReferenceIds.length,
        totalGlobalChoices: inventory.globalChoiceIds.length,
        totalSecurityRoles: securityRoles.length,
        totalFieldSecurityProfiles: fieldSecurityProfiles.length,
        totalAttributeMaskingRules: attributeMaskingRules.length,
        totalColumnSecurityProfiles: columnSecurityProfiles.length,
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

      // Store result for export functionality
      const result: BlueprintResult = {
        metadata: {
          generatedAt: startTime,
          environment: this.client.getEnvironmentUrl(),
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
        erd,
        crossEntityLinks,
        externalEndpoints,
        solutionDistribution,
        securityRoles: securityRoles.length > 0 ? securityRoles : undefined,
        fieldSecurityProfiles: fieldSecurityProfiles.length > 0 ? fieldSecurityProfiles : undefined,
        attributeMaskingRules: attributeMaskingRules.length > 0 ? attributeMaskingRules : undefined,
        columnSecurityProfiles: columnSecurityProfiles.length > 0 ? columnSecurityProfiles : undefined,
      };

      // Store for export
      this.latestResult = result;

      return result;
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
    inventory: ComponentInventoryWithSolutions;
    workflowInventory: WorkflowInventory;
    entities: EntityMetadata[];
  }> {
    const entityDiscovery = new EntityDiscovery(this.client);

    // Fetch publishers for ERD generation
    const publisherDiscovery = new PublisherDiscovery(this.client);
    this.publishers = await publisherDiscovery.getPublishers();

    if (this.scope.type === 'solution' && this.scope.solutionIds) {
      // Solution-based discovery
      const componentDiscovery = new SolutionComponentDiscovery(this.client);

      // Get solution unique names to detect Default solution
      const solutionDiscovery = new SolutionDiscovery(this.client);
      const allSolutions = await solutionDiscovery.getSolutions();
      const selectedSolutions = allSolutions.filter(s => this.scope.solutionIds?.includes(s.solutionid));
      const solutionUniqueNames = selectedSolutions.map(s => s.uniquename);

      // Store solutions for distribution analysis
      this.solutions = selectedSolutions;

      // Discover all component types (will use special handling for Default solution)
      const inventory = await componentDiscovery.discoverComponents(this.scope.solutionIds, solutionUniqueNames);

      // Classify workflows (pass solution maps for tracking)
      const workflowInventory = await componentDiscovery.classifyWorkflows(
        inventory.workflowIds,
        inventory.solutionComponentMap,
        inventory.componentToSolutions
      );

      // Get entity metadata for discovered entities
      // For Default Solution, query all entities (don't filter by managed status)
      const includesDefaultSolution = solutionUniqueNames.some(name => name.toLowerCase() === 'default');
      const entities = includesDefaultSolution
        ? await entityDiscovery.getAllEntities(this.scope.includeSystem) // Get all entities
        : await entityDiscovery.getEntitiesByIds(inventory.entityIds);

      return { inventory, workflowInventory, entities };
    }

    throw new Error('Invalid scope configuration: solutionIds required');
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
        detailedEntity.Attributes = detailedEntity.Attributes.filter((attr) => {
          if (!attr.MetadataId) return false;

          // Normalize GUIDs: remove braces and lowercase for comparison
          const normalizedAttrId = this.normalizeGuid(attr.MetadataId);

          // Check if this attribute's ID exists in the solution attribute IDs
          return attributeIds.some(solutionAttrId =>
            this.normalizeGuid(solutionAttrId) === normalizedAttrId
          );
        });

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
    if (this.scope.type === 'solution' && this.scope.solutionIds) {
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
    if (pluginIds.length === 0) {
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

      const pluginDiscovery = new PluginDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'plugins',
          entityName: '',
          current,
          total,
          message: `Documenting plugins (${current}/${total})...`,
        });
      });
      const plugins = await pluginDiscovery.getPluginsByIds(pluginIds);

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
      console.error('Error processing plugins:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process flows - fetch detailed flow metadata
   */
  private async processFlows(flowIds: string[]): Promise<Flow[]> {
    if (flowIds.length === 0) {
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

      const flowDiscovery = new FlowDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'flows',
          entityName: '',
          current,
          total,
          message: `Documenting flows (${current}/${total})...`,
        });
      });
      const flows = await flowDiscovery.getFlowsByIds(flowIds);

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
      console.error('Error processing flows:', error instanceof Error ? error.message : 'Unknown error');
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
    if (businessRuleIds.length === 0) {
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

      const businessRuleDiscovery = new BusinessRuleDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'business-rules',
          entityName: '',
          current,
          total,
          message: `Documenting business rules (${current}/${total})...`,
        });
      });
      const businessRules = await businessRuleDiscovery.getBusinessRulesByIds(businessRuleIds);

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
      console.error('Error processing business rules:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process web resources - fetch and analyze web resource content
   */
  private async processWebResources(webResourceIds: string[]): Promise<WebResource[]> {
    if (webResourceIds.length === 0) {
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

      const webResourceDiscovery = new WebResourceDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `Analyzing web resources (${current}/${total})...`,
        });
      });
      const webResources = await webResourceDiscovery.getWebResourcesByIds(webResourceIds);

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
      console.error('Error processing web resources:', error instanceof Error ? error.message : 'Unknown error');
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
    if (workflowIds.length === 0) {
      return [];
    }

    console.warn(`⚠️ Found ${workflowIds.length} classic workflow(s) - migration to Power Automate is recommended`);

    try {
      // Report progress
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: workflowIds.length,
        message: `⚠️ Documenting ${workflowIds.length} classic workflow(s) (migration recommended)...`,
      });

      const classicWorkflowDiscovery = new ClassicWorkflowDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `⚠️ Documenting classic workflows (${current}/${total})...`,
        });
      });
      const workflows = await classicWorkflowDiscovery.getClassicWorkflowsByIds(workflowIds);

      // Analyze each workflow for migration
      const analyzer = new WorkflowMigrationAnalyzer();
      for (const workflow of workflows) {
        workflow.migrationRecommendation = analyzer.analyze(workflow);
      }

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
      console.error('Error processing classic workflows:', error instanceof Error ? error.message : 'Unknown error');
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
    if (workflowIds.length === 0) {
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
      const bpfDiscovery = new BusinessProcessFlowDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `📊 Documenting Business Process Flows (${current}/${total})...`,
        });
      });
      const bpfs = await bpfDiscovery.getBusinessProcessFlowsByIds(workflowIds);

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
      console.error('Error processing Business Process Flows:', error instanceof Error ? error.message : 'Unknown error');
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
    if (customApiIds.length === 0) {
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
      const customApiDiscovery = new CustomAPIDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `🔧 Documenting Custom APIs (${current}/${total})...`,
        });
      });
      const customAPIs = await customApiDiscovery.getCustomAPIsByIds(customApiIds);

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
      console.error('Error processing Custom APIs:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process Environment Variables
   */
  private async processEnvironmentVariables(envVarIds: string[]): Promise<import('../types/environmentVariable.js').EnvironmentVariable[]> {
    if (envVarIds.length === 0) {
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
      const envVarDiscovery = new EnvironmentVariableDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `🌍 Documenting Environment Variables (${current}/${total})...`,
        });
      });
      const envVars = await envVarDiscovery.getEnvironmentVariablesByIds(envVarIds);

      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: envVarIds.length,
        total: envVarIds.length,
        message: `🌍 Documented ${envVars.length} Environment Variable(s)`,
      });

      return envVars;
    } catch (error) {
      console.error('Error processing Environment Variables:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async processConnectionReferences(connRefIds: string[]): Promise<import('../types/connectionReference.js').ConnectionReference[]> {
    if (connRefIds.length === 0) return [];
    try {
      this.reportProgress({ phase: 'discovering', entityName: '', current: 0, total: connRefIds.length,
        message: `🔗 Documenting ${connRefIds.length} Connection Reference(s)...` });
      const { ConnectionReferenceDiscovery } = await import('../discovery/ConnectionReferenceDiscovery.js');
      const discovery = new ConnectionReferenceDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `🔗 Documenting Connection References (${current}/${total})...`,
        });
      });
      const refs = await discovery.getConnectionReferencesByIds(connRefIds);
      return refs;
    } catch (error) {
      console.error('Error processing Connection References:', error instanceof Error ? error.message : 'Unknown error');
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
      console.error('Error processing Global Choices:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async processCustomConnectors(connectorIds: string[]): Promise<import('../types/customConnector.js').CustomConnector[]> {
    if (connectorIds.length === 0) return [];
    try {
      this.reportProgress({ phase: 'discovering', entityName: '', current: 0, total: connectorIds.length,
        message: `🔌 Documenting ${connectorIds.length} Custom Connector(s)...` });
      const { CustomConnectorDiscovery } = await import('../discovery/CustomConnectorDiscovery.js');
      const discovery = new CustomConnectorDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `🔌 Documenting Custom Connectors (${current}/${total})...`,
        });
      });
      const connectors = await discovery.getConnectorsByIds(connectorIds);
      return connectors;
    } catch (error) {
      console.error('Error processing Custom Connectors:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process Security Roles
   */
  private async processSecurityRoles(securityRoleIds: string[]): Promise<import('../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail[]> {
    if (securityRoleIds.length === 0) {
      return [];
    }

    try {
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: securityRoleIds.length,
        message: `🔒 Documenting ${securityRoleIds.length} security role(s)...`,
      });

      const securityRoleDiscovery = new SecurityRoleDiscovery(this.client, (current, total) => {
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current,
          total,
          message: `🔒 Documenting security roles (${current}/${total})...`,
        });
      });

      // Get all roles first
      const allRoles = await securityRoleDiscovery.getSecurityRoles();

      // Filter to only roles in the solution
      const rolesInSolution = allRoles.filter(role =>
        securityRoleIds.some(id =>
          this.normalizeGuid(id) === this.normalizeGuid(role.roleid)
        )
      );

      // Get detailed permissions for each role
      const roleDetails: import('../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail[] = [];
      for (let i = 0; i < rolesInSolution.length; i++) {
        const detail = await securityRoleDiscovery.getSecurityRoleDetail(rolesInSolution[i]);
        roleDetails.push(detail);

        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current: i + 1,
          total: rolesInSolution.length,
          message: `🔒 Processing security role: ${rolesInSolution[i].name}`,
        });
      }

      return roleDetails;
    } catch (error) {
      console.error('Error processing security roles:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process Field Security Profiles
   */
  private async processFieldSecurityProfiles(
    profileIds: string[],
    entityNames: string[]
  ): Promise<{
    profiles: import('../discovery/FieldSecurityProfileDiscovery.js').FieldSecurityProfile[];
    fieldSecurityByEntity: Map<string, import('../discovery/FieldSecurityProfileDiscovery.js').EntityFieldSecurity>;
  }> {
    if (profileIds.length === 0) {
      return {
        profiles: [],
        fieldSecurityByEntity: new Map(),
      };
    }

    try {
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: profileIds.length,
        message: `🛡️ Documenting ${profileIds.length} field security profile(s)...`,
      });

      const fieldSecurityDiscovery = new FieldSecurityProfileDiscovery(this.client);

      // Get all profiles
      const allProfiles = await fieldSecurityDiscovery.getFieldSecurityProfiles();

      // Filter to only profiles in the solution
      const profilesInSolution = allProfiles.filter(profile =>
        profileIds.some(id =>
          this.normalizeGuid(id) === this.normalizeGuid(profile.fieldsecurityprofileid)
        )
      );

      // Get field security for all entities
      const fieldSecurityByEntity = await fieldSecurityDiscovery.getEntitiesFieldSecurity(entityNames);

      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: profileIds.length,
        total: profileIds.length,
        message: `🛡️ Documented ${profilesInSolution.length} field security profile(s)`,
      });

      return {
        profiles: profilesInSolution,
        fieldSecurityByEntity,
      };
    } catch (error) {
      console.error('Error processing field security profiles:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Process column security (attribute masking rules and column security profiles)
   */
  private async processColumnSecurity(): Promise<{
    attributeMaskingRules: import('../discovery/ColumnSecurityDiscovery.js').AttributeMaskingRule[];
    columnSecurityProfiles: import('../discovery/ColumnSecurityDiscovery.js').ColumnSecurityProfile[];
  }> {
    try {
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 0,
        total: 2,
        message: `🎭 Discovering attribute masking and column security...`,
      });

      const { ColumnSecurityDiscovery } = await import('../discovery/ColumnSecurityDiscovery.js');
      const columnSecurityDiscovery = new ColumnSecurityDiscovery(this.client);

      // Get attribute masking rules
      const attributeMaskingRules = await columnSecurityDiscovery.getAttributeMaskingRules();

      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 1,
        total: 2,
        message: `🎭 Found ${attributeMaskingRules.length} attribute masking rule(s)`,
      });

      // Get column security profiles
      const columnSecurityProfiles = await columnSecurityDiscovery.getColumnSecurityProfiles();

      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 2,
        total: 2,
        message: `🎭 Column security discovery complete`,
      });

      return {
        attributeMaskingRules,
        columnSecurityProfiles,
      };
    } catch (error) {
      console.error('Error processing column security:', error instanceof Error ? error.message : 'Unknown error');
      // Return empty arrays on error instead of failing the entire blueprint
      return {
        attributeMaskingRules: [],
        columnSecurityProfiles: [],
      };
    }
  }

  /**
   * Process Canvas Apps
   */
  /**
   * Process forms and JavaScript event handlers
   */
  private async processForms(entityNames: string[], formIds: string[]): Promise<import('../types/blueprint.js').FormDefinition[]> {
    if (entityNames.length === 0) {
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
      const allForms = await formDiscovery.getFormsForEntities(entityNames);

      console.log(`[FORMS DEBUG] Discovered ${allForms.length} total forms for ${entityNames.length} entities`);
      console.log(`[FORMS DEBUG] Solution formIds count: ${formIds.length}`);

      // If no formIds provided from solution components, return all forms for the entities
      // This handles cases where forms might not be tracked as solution components
      if (formIds.length === 0) {
        console.log('[FORMS DEBUG] No formIds in solution components - returning all forms for entities');
        this.reportProgress({
          phase: 'discovering',
          entityName: '',
          current: allForms.length,
          total: allForms.length,
          message: `${allForms.length} forms discovered (not filtered by solution)`,
        });
        return allForms;
      }

      // Filter forms to only include those in the solution(s)
      // Normalize formIds for comparison (lowercase, no braces)
      const normalizedFormIds = new Set(formIds.map(id => id.toLowerCase().replace(/[{}]/g, '')));

      const forms = allForms.filter(form => {
        const normalizedFormId = form.id.toLowerCase().replace(/[{}]/g, '');
        const included = normalizedFormIds.has(normalizedFormId);
        if (!included) {
          console.log(`[FORMS DEBUG] Form "${form.name}" (${form.id}) not in solution - excluded`);
        }
        return included;
      });

      console.log(`[FORMS DEBUG] After filtering: ${forms.length} forms in solution(s)`);

      // Report completion
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: forms.length,
        total: forms.length,
        message: `${forms.length} forms discovered in solution(s)`,
      });

      return forms;
    } catch (error) {
      console.error('Error processing forms:', error instanceof Error ? error.message : 'Unknown error');
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

  /**
   * Export blueprint as JSON
   * @returns JSON string with metadata wrapper
   */
  async exportAsJson(): Promise<string> {
    const { JsonReporter } = await import('../reporters/JsonReporter.js');
    const reporter = new JsonReporter();
    return reporter.generate(this.latestResult!);
  }

  /**
   * Export blueprint as Markdown
   * @returns MarkdownExport with file map and structure
   */
  async exportAsMarkdown(): Promise<import('../types/blueprint.js').MarkdownExport> {
    const { MarkdownReporter } = await import('../reporters/MarkdownReporter.js');
    const reporter = new MarkdownReporter();
    return reporter.generate(this.latestResult!);
  }

  /**
   * Export blueprint as HTML
   * @returns HTML string (single-page document)
   */
  async exportAsHtml(): Promise<string> {
    const { HtmlReporter } = await import('../reporters/HtmlReporter.js');
    const reporter = new HtmlReporter();
    return reporter.generate(this.latestResult!);
  }

  /**
   * Export blueprint as ZIP package
   * @param formats Array of formats to include ('json', 'html', 'markdown')
   * @returns ZIP file as Blob for browser download
   */
  async exportAsZip(formats: string[]): Promise<Blob> {
    const { ZipPackager } = await import('../exporters/ZipPackager.js');
    const packager = new ZipPackager();

    let json: string | undefined;
    let html: string | undefined;
    let markdown: import('../types/blueprint.js').MarkdownExport | undefined;

    // Generate selected formats
    if (formats.includes('json')) {
      json = await this.exportAsJson();
    }

    if (formats.includes('html')) {
      html = await this.exportAsHtml();
    }

    if (formats.includes('markdown')) {
      markdown = await this.exportAsMarkdown();
    }

    // Package into ZIP
    return packager.packageBlueprint(markdown, json, html);
  }

  /**
   * Export all formats as ZIP
   * Convenience method for full export
   * @returns ZIP file as Blob
   */
  async exportAll(): Promise<Blob> {
    return this.exportAsZip(['markdown', 'json', 'html']);
  }

}
