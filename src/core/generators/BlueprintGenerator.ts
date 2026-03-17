import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import { FetchLogger } from '../utils/FetchLogger.js';
import { withConcurrencyLimit } from '../utils/withConcurrencyLimit.js';
import { EntityDiscovery } from '../discovery/EntityDiscovery.js';
import { SolutionComponentDiscovery } from '../discovery/SolutionComponentDiscovery.js';
import { SolutionDiscovery } from '../discovery/SolutionDiscovery.js';
import { PublisherDiscovery } from '../discovery/PublisherDiscovery.js';
import { SchemaDiscovery } from '../discovery/SchemaDiscovery.js';
import { ERDGenerator } from '../generators/ERDGenerator.js';
import { CrossEntityAnalyzer } from '../analyzers/CrossEntityAnalyzer.js';
import { ExternalDependencyAggregator } from '../analyzers/ExternalDependencyAggregator.js';
import { SolutionDistributionAnalyzer } from '../analyzers/SolutionDistributionAnalyzer.js';
import { filterSystemFields } from '../utils/fieldFilters.js';
import { normalizeGuid } from '../utils/guid.js';
import { GENERATOR_STEPS } from './processors/generatorSteps.js';
import { createAccumulator } from './processors/ProcessorStep.js';
import type { ProcessorContext } from './processors/ProcessorStep.js';
import { JsonReporter } from '../reporters/JsonReporter.js';
import { MarkdownReporter } from '../reporters/MarkdownReporter.js';
import { HtmlReporter } from '../reporters/HtmlReporter.js';
import { ZipPackager } from '../exporters/ZipPackager.js';
import type { EntityMetadata, Publisher, Solution } from '../types.js';
import type { ComponentInventory, ComponentInventoryWithSolutions, WorkflowInventory } from '../types/components.js';
import type {
  GeneratorOptions,
  BlueprintResult,
  EntityBlueprint,
  ProgressInfo,
  StepWarning,
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
  private logger: FetchLogger = new FetchLogger();
  private stepWarnings: StepWarning[] = [];

  /** Scale tier based on entity count — controls concurrency and retry aggressiveness */
  private getScaleTier(entityCount: number): { concurrency: number; initialBatchSize: number; maxAttempts: number; baseDelayMs: number } {
    if (entityCount >= 500) return { concurrency: 2, initialBatchSize: 8,  maxAttempts: 5, baseDelayMs: 2000 };
    if (entityCount >= 200) return { concurrency: 3, initialBatchSize: 10, maxAttempts: 5, baseDelayMs: 1500 };
    if (entityCount >= 50)  return { concurrency: 4, initialBatchSize: 15, maxAttempts: 4, baseDelayMs: 1000 };
    return                         { concurrency: 5, initialBatchSize: 20, maxAttempts: 4, baseDelayMs: 1000 };
  }

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
    this.logger = new FetchLogger();
    this.stepWarnings = [];

    // Forward live fetch entries to the caller if they subscribed
    const unsubscribeFetchLogger = this.options.onFetchEntry
      ? this.logger.subscribe(this.options.onFetchEntry)
      : undefined;

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
      const scaleTier = this.getScaleTier(entities.length);

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
      const entityBlueprints = await this.processEntities(entities, inventory.attributeIds, scaleTier.concurrency);
      if (entities.length === 0) {
        warnings.push('No entities found in selected scope');
      }

      if (this.options.signal?.aborted) throw new Error('Blueprint generation cancelled');

      // STEPS 3-7: Run all registered processor steps
      const acc = createAccumulator();
      const processorContext: ProcessorContext = {
        client: this.client,
        inventory,
        workflowInventory,
        entities,
        signal: this.options.signal,
        onProgress: this.reportProgress.bind(this),
        stepWarnings: this.stepWarnings,
        logger: this.logger,
        acc,
      };

      for (const step of GENERATOR_STEPS) {
        if (this.options.signal?.aborted) throw new Error('Blueprint generation cancelled');
        await step.run(processorContext);
      }

      // Merge step-level warnings into the top-level warnings array
      warnings.push(...acc.warnings);

      // Destructure accumulator for readability in subsequent code
      const {
        plugins, pluginsByEntity,
        flows, flowsByEntity,
        businessRules, businessRulesByEntity,
        classicWorkflows, classicWorkflowsByEntity,
        businessProcessFlows, businessProcessFlowsByEntity,
        customAPIs, environmentVariables, connectionReferences,
        globalChoices, customConnectors,
        securityRoles, fieldSecurityProfiles, fieldSecurityByEntity,
        attributeMaskingRules, columnSecurityProfiles,
        canvasApps, customPages, modelDrivenApps,
        webResources, webResourcesByType,
        formsByEntity,
      } = acc;

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
      const bpfEntityNames = new Set(businessProcessFlows.map(b => b.uniqueName.toLowerCase()));
      const erd = erdGenerator.generateMermaidERD(entityBlueprints, this.publishers, bpfEntityNames);
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 1,
        total: 4,
        message: 'ERD generated',
      });

      // 10.2: Analyze cross-entity automation
      const crossEntityAnalyzer = new CrossEntityAnalyzer();
      const crossEntityAnalysis = crossEntityAnalyzer.analyze(entityBlueprints, classicWorkflows, flows);
      this.reportProgress({
        phase: 'discovering',
        entityName: '',
        current: 2,
        total: 4,
        message: 'Cross-entity automation analyzed',
      });

      // 10.3: Aggregate external dependencies
      const externalDependencyAggregator = new ExternalDependencyAggregator();
      const blueprintResultPartial: BlueprintResult = {
        metadata: {
          generatedAt: startTime,
          environment: this.client.getEnvironmentUrl(),
          solutionNames: this.solutions.length > 0 ? this.solutions.map(s => s.friendlyname || s.uniquename) : undefined,
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
          totalModelDrivenApps: 0,
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
        canvasApps,
        customPages,
        modelDrivenApps,
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
        totalCanvasApps: canvasApps.length,
        totalCustomPages: customPages.length,
        totalModelDrivenApps: modelDrivenApps.length,
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
          solutionNames: this.solutions.length > 0 ? this.solutions.map(s => s.friendlyname || s.uniquename) : undefined,
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
        canvasApps,
        customPages,
        modelDrivenApps,
        webResources,
        webResourcesByType,
        erd,
        crossEntityAnalysis: crossEntityAnalysis.totalEntryPoints > 0 ? crossEntityAnalysis : undefined,
        externalEndpoints,
        solutionDistribution,
        securityRoles: securityRoles.length > 0 ? securityRoles : undefined,
        fieldSecurityProfiles: fieldSecurityProfiles.length > 0 ? fieldSecurityProfiles : undefined,
        attributeMaskingRules: attributeMaskingRules.length > 0 ? attributeMaskingRules : undefined,
        columnSecurityProfiles: columnSecurityProfiles.length > 0 ? columnSecurityProfiles : undefined,
        stepWarnings: this.stepWarnings.length > 0 ? this.stepWarnings : undefined,
        fetchLog: this.logger.getEntries(),
      };

      // Store for export
      this.latestResult = result;

      return result;
    } catch (error) {
      throw new Error(
        `Blueprint generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      unsubscribeFetchLogger?.();
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
      const componentDiscovery = new SolutionComponentDiscovery(this.client, this.logger);

      // Get solution unique names to detect Default solution
      const solutionDiscovery = new SolutionDiscovery(this.client);
      const allSolutions = await solutionDiscovery.getSolutions();
      const selectedSolutions = allSolutions.filter(s => this.scope.solutionIds?.includes(s.solutionid));
      // Build uniqueNames in the SAME ORDER as this.scope.solutionIds (not alphabetical order from allSolutions)
      // so index-based alignment in discoverComponents remains correct.
      const solutionIdToUniquename = new Map(allSolutions.map(s => [s.solutionid, s.uniquename]));
      const solutionUniqueNames = (this.scope.solutionIds ?? []).map(id => solutionIdToUniquename.get(id) ?? '');

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
  private async processEntities(entities: EntityMetadata[], attributeIds: string[], concurrency = 5): Promise<EntityBlueprint[]> {
    const total = entities.length;
    let completed = 0;

    const tasks = entities.map(entity => async () => {
      if (this.options.signal?.aborted) throw new Error('Blueprint generation cancelled');

      const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName;
      const current = ++completed;

      this.reportProgress({
        phase: 'schema',
        entityName: entity.LogicalName,
        current,
        total,
        message: `Processing ${displayName} (${current}/${total})...`,
      });

      const schemaDiscovery = new SchemaDiscovery(this.client);
      const schemaStart = Date.now();
      const detailedEntity = await schemaDiscovery.getEntitySchema(entity.LogicalName);
      this.logger.log({
        timestamp: new Date(schemaStart),
        step: 'Entity Schema',
        entitySet: 'EntityDefinitions',
        filterSummary: displayName,
        batchIndex: current - 1,
        batchTotal: total,
        batchSize: 1,
        status: 'success',
        attempts: 1,
        durationMs: Date.now() - schemaStart,
        resultCount: detailedEntity.Attributes?.length,
      });

      // For custom entities, all attributes are implicitly included
      // Only filter attributes for system entities
      const isCustomEntity = entity.IsCustomEntity;

      if (detailedEntity.Attributes && !isCustomEntity && attributeIds.length > 0) {
        // Only filter system entity attributes to those in solution
        detailedEntity.Attributes = detailedEntity.Attributes.filter((attr) => {
          if (!attr.MetadataId) return false;

          // Normalize GUIDs: remove braces and lowercase for comparison
          const normalizedAttrId = normalizeGuid(attr.MetadataId);

          // Check if this attribute's ID exists in the solution attribute IDs
          return attributeIds.some(solutionAttrId =>
            normalizeGuid(solutionAttrId) === normalizedAttrId
          );
        });

      }

      // Filter system fields if requested
      if (this.scope.excludeSystemFields && detailedEntity.Attributes) {
        detailedEntity.Attributes = filterSystemFields(detailedEntity.Attributes, true);
      }

      return {
        entity: detailedEntity,
        plugins: [],
        flows: [],
        businessRules: [],
        forms: [],
      } as EntityBlueprint;
    });

    const settled = await withConcurrencyLimit(concurrency, tasks);
    const blueprints: EntityBlueprint[] = [];
    let entityFailCount = 0;
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        blueprints.push(r.value);
      } else {
        entityFailCount++;
      }
    }
    if (entityFailCount > 0) {
      this.stepWarnings.push({
        step: 'Entity Schema',
        message: `${entityFailCount} of ${entities.length} entity schema(s) could not be fetched — results may be incomplete. See Fetch Log for details.`,
        partial: true,
        failedCount: entityFailCount,
      });
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
   * Export blueprint as JSON
   * @returns JSON string with metadata wrapper
   */
  async exportAsJson(): Promise<string> {
    const reporter = new JsonReporter();
    return reporter.generate(this.latestResult!);
  }

  /**
   * Export blueprint as Markdown
   * @returns MarkdownExport with file map and structure
   */
  async exportAsMarkdown(): Promise<import('../types/blueprint.js').MarkdownExport> {
    const reporter = new MarkdownReporter();
    return reporter.generate(this.latestResult!);
  }

  /**
   * Export blueprint as HTML
   * @returns HTML string (single-page document)
   */
  async exportAsHtml(): Promise<string> {
    const reporter = new HtmlReporter();
    return reporter.generate(this.latestResult!);
  }

  /**
   * Export blueprint as ZIP package
   * @param formats Array of formats to include ('json', 'html', 'markdown')
   * @returns ZIP file as Blob for browser download
   */
  async exportAsZip(formats: string[]): Promise<Blob> {
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
