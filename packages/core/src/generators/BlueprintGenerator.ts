import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import { EntityDiscovery } from '../discovery/EntityDiscovery.js';
import { SolutionComponentDiscovery } from '../discovery/SolutionComponentDiscovery.js';
import { SchemaDiscovery } from '../discovery/SchemaDiscovery.js';
import { PluginDiscovery } from '../discovery/PluginDiscovery.js';
import { filterSystemFields } from '../utils/fieldFilters.js';
import type { EntityMetadata, PluginStep } from '../types.js';
import type { ComponentInventory, WorkflowInventory } from '../types/components.js';
import type {
  GeneratorOptions,
  BlueprintResult,
  EntityBlueprint,
  ProgressInfo,
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
      const entityBlueprints = await this.processEntities(entities);
      if (entities.length === 0) {
        warnings.push('No entities found in selected scope');
      }

      // STEP 3: Process Plugins
      const plugins = await this.processPlugins(inventory.pluginIds);
      const pluginsByEntity = this.groupPluginsByEntity(plugins);

      if (inventory.pluginIds.length === 0) {
        warnings.push('No plugins found');
      }

      // STEP 4-7: Process other components (stubbed for now)
      // These will be implemented later
      if (workflowInventory.flowIds.length === 0) {
        warnings.push('No flows found');
      }
      if (workflowInventory.businessRuleIds.length === 0) {
        warnings.push('No business rules found');
      }
      if (inventory.webResourceIds.length === 0) {
        warnings.push('No web resources found');
      }
      if (inventory.canvasAppIds.length === 0) {
        warnings.push('No canvas apps found');
      }

      // Generate summary
      const summary = {
        totalEntities: entityBlueprints.length,
        totalPlugins: inventory.pluginIds.length,
        totalFlows: workflowInventory.flowIds.length,
        totalBusinessRules: workflowInventory.businessRuleIds.length,
        totalAttributes: entityBlueprints.reduce((sum, bp) => sum + (bp.entity.Attributes?.length || 0), 0),
        totalWebResources: inventory.webResourceIds.length,
        totalCanvasApps: inventory.canvasAppIds.length,
        totalCustomPages: inventory.customPageIds.length,
        totalConnectionReferences: inventory.connectionReferenceIds.length,
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
      // Return empty inventory
      const inventory: ComponentInventory = {
        entityIds: entities.map(e => e.MetadataId),
        pluginIds: [],
        workflowIds: [],
        webResourceIds: [],
        canvasAppIds: [],
        customPageIds: [],
        connectionReferenceIds: [],
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
   * Process all entities - fetch detailed schema
   */
  private async processEntities(entities: EntityMetadata[]): Promise<EntityBlueprint[]> {
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

      // Filter system fields if requested
      if (this.scope.excludeSystemFields && detailedEntity.Attributes) {
        detailedEntity.Attributes = filterSystemFields(detailedEntity.Attributes, true);
      }

      blueprints.push({
        entity: detailedEntity,
        plugins: [],
        flows: [],
        businessRules: [],
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
      inventory.connectionReferenceIds.length === 0
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
    if (pluginIds.length === 0) {
      return [];
    }

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

    // Report completion
    this.reportProgress({
      phase: 'plugins',
      entityName: '',
      current: plugins.length,
      total: plugins.length,
      message: 'Plugins documented',
    });

    return plugins;
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
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
