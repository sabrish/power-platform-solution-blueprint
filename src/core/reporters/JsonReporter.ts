import type { BlueprintResult } from '../types/blueprint.js';

/**
 * Export wrapper for JSON blueprint export
 */
interface JsonExportWrapper {
  exportVersion: string;
  exportedAt: string;
  toolVersion: string;
  blueprint: Record<string, unknown>;
}

/**
 * Exports blueprint as JSON with metadata wrapper
 *
 * Use cases:
 * - Baseline comparison (next day)
 * - Programmatic consumption
 * - Data analysis
 * - CI/CD pipelines
 * - Version control (git diff friendly)
 */
export class JsonReporter {
  private readonly toolVersion = '1.1.0';

  /**
   * Generate JSON export of blueprint
   * @param result Complete blueprint result
   * @returns JSON string (pretty-printed with 2-space indentation)
   */
  generate(result: BlueprintResult): string {
    // Create export wrapper with metadata
    const exportWrapper: JsonExportWrapper = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      toolVersion: this.toolVersion,
      blueprint: this.serializeResult(result),
    };

    // Pretty-print with 2-space indentation
    return JSON.stringify(exportWrapper, this.jsonReplacer, 2);
  }

  /**
   * Serialize BlueprintResult to plain object
   * Handles Maps, Dates, and undefined values
   */
  private serializeResult(result: BlueprintResult): Record<string, unknown> {
    return {
      metadata: {
        ...result.metadata,
        generatedAt: result.metadata.generatedAt.toISOString(),
      },
      entities: result.entities,
      summary: result.summary,
      plugins: result.plugins,
      pluginsByEntity: this.mapToObject(result.pluginsByEntity),
      flows: result.flows,
      flowsByEntity: this.mapToObject(result.flowsByEntity),
      businessRules: result.businessRules,
      businessRulesByEntity: this.mapToObject(result.businessRulesByEntity),
      classicWorkflows: result.classicWorkflows,
      classicWorkflowsByEntity: this.mapToObject(result.classicWorkflowsByEntity),
      businessProcessFlows: result.businessProcessFlows,
      businessProcessFlowsByEntity: this.mapToObject(result.businessProcessFlowsByEntity),
      customAPIs: result.customAPIs,
      environmentVariables: result.environmentVariables.map(ev => ({
        ...ev,
        currentValue: undefined,
        defaultValue: undefined,
        hasCurrentValue: !!ev.currentValue,
        hasDefaultValue: !!ev.defaultValue,
      })),
      connectionReferences: result.connectionReferences,
      globalChoices: result.globalChoices,
      customConnectors: result.customConnectors,
      canvasApps: result.canvasApps,
      customPages: result.customPages,
      modelDrivenApps: result.modelDrivenApps,
      webResources: result.webResources,
      webResourcesByType: this.mapToObject(result.webResourcesByType),
      erd: result.erd,
      crossEntityAnalysis: result.crossEntityAnalysis
        ? {
            entityViews: this.mapToObject(result.crossEntityAnalysis.entityViews),
            chainLinks: result.crossEntityAnalysis.chainLinks,
            totalEntryPoints: result.crossEntityAnalysis.totalEntryPoints,
            totalBranches: result.crossEntityAnalysis.totalBranches,
            risks: result.crossEntityAnalysis.risks,
            allEntityPipelines: this.mapToObject(result.crossEntityAnalysis.allEntityPipelines),
            noFilterPluginCount: result.crossEntityAnalysis.noFilterPluginCount,
          }
        : undefined,
      externalEndpoints: result.externalEndpoints,
      solutionDistribution: result.solutionDistribution,
      securityRoles: result.securityRoles,
      fieldSecurityProfiles: result.fieldSecurityProfiles,
      attributeMaskingRules: result.attributeMaskingRules,
      columnSecurityProfiles: result.columnSecurityProfiles,
    };
  }

  /**
   * Convert Map to plain object for JSON serialization
   */
  private mapToObject<T>(map: Map<string, T>): Record<string, T> {
    const obj: Record<string, T> = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Custom JSON replacer function
   * - Converts undefined to null
   * - Handles Date objects
   * - Removes circular references
   */
  private jsonReplacer(_key: string, value: unknown): unknown {
    // Convert undefined to null
    if (value === undefined) {
      return null;
    }

    // Convert Date to ISO string
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Convert Map to object
    if (value instanceof Map) {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of value.entries()) {
        obj[k] = v;
      }
      return obj;
    }

    return value;
  }
}
