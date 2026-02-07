import type { PluginStep } from '../types.js';
import type { Flow, BusinessRule, ExecutionPipeline, ExecutionStep } from '../types/blueprint.js';

/**
 * Calculates execution order for entity events
 *
 * TODO: Add support for JavaScript form scripts
 * - Query systemform table for form definitions
 * - Parse FormXml to extract web resource libraries and event handlers
 * - Include OnLoad, OnSave, onChange handlers in client-side execution
 */
export class ExecutionOrderCalculator {
  /**
   * Calculate execution pipeline for a specific entity and event
   * @param entity Entity logical name
   * @param event Event type (Create, Update, Delete, etc.)
   * @param plugins Plugin steps for this entity
   * @param flows Flows for this entity
   * @param businessRules Business rules for this entity
   * @returns Complete execution pipeline
   */
  calculatePipeline(
    entity: string,
    event: string,
    plugins: PluginStep[],
    flows: Flow[],
    businessRules: BusinessRule[]
  ): ExecutionPipeline {
    // Filter relevant plugins for this event
    const relevantPlugins = plugins.filter(
      (p) => p.entity === entity && p.message.toLowerCase() === event.toLowerCase()
    );

    // Filter relevant flows for this event
    const relevantFlows = flows.filter((f) => {
      if (f.entity !== entity) return false;

      const eventMatch =
        (event === 'Create' && (f.definition.triggerEvent === 'Create' || f.definition.triggerEvent === 'CreateOrUpdate')) ||
        (event === 'Update' && (f.definition.triggerEvent === 'Update' || f.definition.triggerEvent === 'CreateOrUpdate')) ||
        (event === 'Delete' && f.definition.triggerEvent === 'Delete');

      return eventMatch;
    });

    // All business rules are client-side
    const relevantBusinessRules = businessRules.filter((br) => br.entity === entity);

    // Build client-side steps
    const clientSide = this.buildClientSideSteps(relevantBusinessRules);

    // Build server-side steps
    const serverSideSync = this.buildServerSideSteps(relevantPlugins, relevantFlows);

    // Build async steps
    const serverSideAsync = this.buildAsyncSteps(relevantPlugins, relevantFlows);

    // Calculate totals
    const totalSteps =
      clientSide.length +
      serverSideSync.preValidation.length +
      serverSideSync.preOperation.length +
      serverSideSync.mainOperation.length +
      serverSideSync.postOperation.length +
      serverSideAsync.length;

    const hasExternalCalls = this.checkExternalCalls(clientSide, serverSideSync, serverSideAsync);

    return {
      event,
      clientSide,
      serverSideSync,
      serverSideAsync,
      totalSteps,
      hasExternalCalls,
      performanceRisks: [], // Will be populated by PerformanceAnalyzer
    };
  }

  /**
   * Build client-side execution steps from business rules
   */
  private buildClientSideSteps(businessRules: BusinessRule[]): ExecutionStep[] {
    return businessRules
      .filter((br) => br.state === 'Active')
      .map((br, index) => ({
        order: index + 1,
        type: 'BusinessRule' as const,
        name: br.name,
        id: br.id,
        mode: 'Client' as const,
        hasExternalCall: false, // Business rules don't make external calls
        description: br.description || undefined,
      }));
  }

  /**
   * Build server-side synchronous steps from plugins and flows
   */
  private buildServerSideSteps(
    plugins: PluginStep[],
    flows: Flow[]
  ): {
    preValidation: ExecutionStep[];
    preOperation: ExecutionStep[];
    mainOperation: ExecutionStep[];
    postOperation: ExecutionStep[];
  } {
    // Sort plugins by stage and rank
    const sortedPlugins = [...plugins].sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.rank - b.rank;
    });

    // Categorize by stage
    const preValidation: ExecutionStep[] = [];
    const preOperation: ExecutionStep[] = [];
    const mainOperation: ExecutionStep[] = [];
    const postOperation: ExecutionStep[] = [];

    // Mode 0 = Synchronous, Mode 1 = Asynchronous
    sortedPlugins
      .filter((p) => p.mode === 0)
      .forEach((plugin) => {
        const step: ExecutionStep = {
          order: 0, // Will be set after grouping
          type: 'Plugin' as const,
          name: plugin.name || plugin.typeName,
          id: plugin.id,
          stage: plugin.stage,
          rank: plugin.rank,
          mode: 'Sync' as const,
          hasExternalCall: false, // Plugin external call detection not implemented
          externalEndpoints: undefined,
          description: plugin.description || undefined,
        };

        switch (plugin.stage) {
          case 10:
            preValidation.push(step);
            break;
          case 20:
            preOperation.push(step);
            break;
          case 30:
            mainOperation.push(step);
            break;
          case 40:
            postOperation.push(step);
            break;
        }
      });

    // Add synchronous flows to postOperation (they execute after mainOperation)
    flows
      .filter((f) => f.state === 'Active' && f.scope !== 50) // scope 50 is async
      .forEach((flow) => {
        postOperation.push({
          order: 0, // Will be set after grouping
          type: 'Flow' as const,
          name: flow.name,
          id: flow.id,
          mode: 'Sync' as const,
          hasExternalCall: flow.hasExternalCalls,
          externalEndpoints: flow.definition.externalCalls.map((c) => c.url),
          description: flow.description || undefined,
        });
      });

    // Set order within each stage
    preValidation.forEach((step, i) => (step.order = i + 1));
    preOperation.forEach((step, i) => (step.order = i + 1));
    mainOperation.forEach((step, i) => (step.order = i + 1));
    postOperation.forEach((step, i) => (step.order = i + 1));

    return {
      preValidation,
      preOperation,
      mainOperation,
      postOperation,
    };
  }

  /**
   * Build asynchronous execution steps
   */
  private buildAsyncSteps(plugins: PluginStep[], flows: Flow[]): ExecutionStep[] {
    const asyncSteps: ExecutionStep[] = [];

    // Add async plugins (Mode 1 = Asynchronous)
    plugins
      .filter((p) => p.mode === 1)
      .forEach((plugin) => {
        asyncSteps.push({
          order: asyncSteps.length + 1,
          type: 'Plugin' as const,
          name: plugin.name || plugin.typeName,
          id: plugin.id,
          stage: plugin.stage,
          rank: plugin.rank,
          mode: 'Async' as const,
          hasExternalCall: false, // Plugin external call detection not implemented
          externalEndpoints: undefined,
          description: plugin.description || undefined,
        });
      });

    // Add async flows
    flows
      .filter((f) => f.state === 'Active' && f.scope === 50)
      .forEach((flow) => {
        asyncSteps.push({
          order: asyncSteps.length + 1,
          type: 'Flow' as const,
          name: flow.name,
          id: flow.id,
          mode: 'Async' as const,
          hasExternalCall: flow.hasExternalCalls,
          externalEndpoints: flow.definition.externalCalls.map((c) => c.url),
          description: flow.description || undefined,
        });
      });

    return asyncSteps;
  }

  /**
   * Check if any step has external calls
   */
  private checkExternalCalls(
    clientSide: ExecutionStep[],
    serverSideSync: {
      preValidation: ExecutionStep[];
      preOperation: ExecutionStep[];
      mainOperation: ExecutionStep[];
      postOperation: ExecutionStep[];
    },
    serverSideAsync: ExecutionStep[]
  ): boolean {
    const allSteps = [
      ...clientSide,
      ...serverSideSync.preValidation,
      ...serverSideSync.preOperation,
      ...serverSideSync.mainOperation,
      ...serverSideSync.postOperation,
      ...serverSideAsync,
    ];

    return allSteps.some((step) => step.hasExternalCall);
  }

  /**
   * Get all unique events for an entity from plugins, flows, and business rules
   */
  getEntityEvents(entity: string, plugins: PluginStep[], flows: Flow[], businessRules: BusinessRule[]): string[] {
    const events = new Set<string>();

    // Add plugin events
    plugins
      .filter((p) => p.entity === entity)
      .forEach((p) => events.add(p.message));

    // Add flow events
    flows
      .filter((f) => f.entity === entity)
      .forEach((f) => {
        if (f.definition.triggerEvent === 'Create') events.add('Create');
        if (f.definition.triggerEvent === 'Update') events.add('Update');
        if (f.definition.triggerEvent === 'Delete') events.add('Delete');
        if (f.definition.triggerEvent === 'CreateOrUpdate') {
          events.add('Create');
          events.add('Update');
        }
      });

    // Business rules execute on client-side during form operations (create/update)
    // They run on form load and field changes, so they apply to both Create and Update
    const entityBusinessRules = businessRules.filter((br) => br.entity === entity);
    if (entityBusinessRules.length > 0) {
      events.add('Create');
      events.add('Update');
    }

    return Array.from(events).sort();
  }
}
