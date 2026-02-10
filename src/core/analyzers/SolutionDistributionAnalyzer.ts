import type {
  SolutionDistribution,
  ComponentCounts,
  SharedComponent,
  SolutionDependency,
  BlueprintResult,
} from '../types/blueprint.js';
import type { Solution } from '../types.js';

/**
 * Analyzes component distribution across solutions
 */
export class SolutionDistributionAnalyzer {
  /**
   * Analyze solution distribution with component counts and dependencies
   * @param solutions Array of solution metadata
   * @param result Complete blueprint result with all components
   * @param solutionComponentMap Optional map of solution IDs to component IDs for accurate counting
   */
  analyzeSolutionDistribution(
    solutions: Solution[],
    result: BlueprintResult,
    solutionComponentMap?: Map<string, Set<string>>
  ): SolutionDistribution[] {
    const distributions: SolutionDistribution[] = [];

    for (const solution of solutions) {
      // Count components in this solution
      const componentCounts = solutionComponentMap
        ? this.countComponentsInSolutionAccurate(solution, result, solutionComponentMap)
        : this.countComponentsInSolution(solution, result);

      // Identify shared components (appear in multiple solutions)
      const sharedComponents = this.identifySharedComponents(solution, solutions, result);

      // Identify dependencies on other solutions
      const dependencies = this.identifyDependencies(solution, solutions, result);

      distributions.push({
        solutionName: solution.friendlyname,
        solutionId: solution.solutionid,
        publisher: solution.publisherid.friendlyname,
        version: solution.version,
        isManaged: solution.ismanaged,
        componentCounts,
        sharedComponents,
        dependencies,
      });
    }

    // Sort by solution name
    return distributions.sort((a, b) => a.solutionName.localeCompare(b.solutionName));
  }

  /**
   * Count components in a solution
   */
  private countComponentsInSolution(_solution: Solution, result: BlueprintResult): ComponentCounts {
    // Note: This is a simplified version that counts all components in the result
    // In a real implementation, we would need to track which components belong to which solution
    // This would require passing solution component metadata from SolutionComponentDiscovery

    // For now, we'll estimate based on the overall counts
    // TODO: Track solution membership in component discovery phase

    const counts: ComponentCounts = {
      entities: result.entities.length,
      plugins: result.plugins.length,
      flows: result.flows.length,
      businessRules: result.businessRules.length,
      classicWorkflows: result.classicWorkflows.length,
      bpfs: result.businessProcessFlows.length,
      webResources: result.webResources.length,
      customAPIs: result.customAPIs.length,
      environmentVariables: result.environmentVariables.length,
      connectionReferences: result.connectionReferences.length,
      globalChoices: result.globalChoices.length,
      total: 0,
    };

    // Calculate total
    counts.total = Object.entries(counts)
      .filter(([key]) => key !== 'total')
      .reduce((sum, [, value]) => sum + value, 0);

    return counts;
  }

  /**
   * Count components that actually belong to a specific solution (accurate counting)
   */
  private countComponentsInSolutionAccurate(
    solution: Solution,
    result: BlueprintResult,
    solutionComponentMap: Map<string, Set<string>>
  ): ComponentCounts {
    const solutionId = solution.solutionid.toLowerCase().replace(/[{}]/g, '');
    const componentIdsInSolution = solutionComponentMap.get(solutionId) || new Set();

    const counts: ComponentCounts = {
      entities: result.entities.filter(e =>
        componentIdsInSolution.has(e.entity.MetadataId.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      plugins: result.plugins.filter(p =>
        componentIdsInSolution.has(p.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      flows: result.flows.filter(f =>
        componentIdsInSolution.has(f.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      businessRules: result.businessRules.filter(br =>
        componentIdsInSolution.has(br.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      classicWorkflows: result.classicWorkflows.filter(wf =>
        componentIdsInSolution.has(wf.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      bpfs: result.businessProcessFlows.filter(bpf =>
        componentIdsInSolution.has(bpf.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      webResources: result.webResources.filter(wr =>
        componentIdsInSolution.has(wr.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      customAPIs: result.customAPIs.filter(api =>
        componentIdsInSolution.has(api.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      environmentVariables: result.environmentVariables.filter(ev =>
        componentIdsInSolution.has(ev.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      connectionReferences: result.connectionReferences.filter(cr =>
        componentIdsInSolution.has(cr.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      globalChoices: result.globalChoices.filter(gc =>
        componentIdsInSolution.has(gc.id.toLowerCase().replace(/[{}]/g, ''))
      ).length,

      total: 0,
    };

    // Calculate total
    counts.total = Object.entries(counts)
      .filter(([key]) => key !== 'total')
      .reduce((sum, [, value]) => sum + value, 0);

    return counts;
  }

  /**
   * Identify components shared across multiple solutions
   */
  private identifySharedComponents(
    _solution: Solution,
    _allSolutions: Solution[],
    _result: BlueprintResult
  ): SharedComponent[] {
    const shared: SharedComponent[] = [];

    // This is a placeholder implementation
    // In reality, we would need to track which components belong to which solutions
    // This requires solution component metadata from the discovery phase

    // TODO: Implement by checking component solution membership
    // For each component, check if it appears in multiple solutions

    return shared;
  }

  /**
   * Identify dependencies on other solutions
   */
  private identifyDependencies(
    solution: Solution,
    allSolutions: Solution[],
    result: BlueprintResult
  ): SolutionDependency[] {
    const dependencies: SolutionDependency[] = [];

    // Build publisher prefix map
    const solutionPublisherPrefixes = new Map<string, string>();
    for (const sol of allSolutions) {
      solutionPublisherPrefixes.set(sol.solutionid, sol.publisherid.uniquename);
    }

    const currentPublisher = solution.publisherid.uniquename;

    // Check for cross-solution entity references
    for (const entity of result.entities) {
      const entityPublisher = this.extractPublisherPrefix(entity.entity.SchemaName);

      // If entity belongs to a different publisher, it's a potential dependency
      if (entityPublisher && entityPublisher !== currentPublisher) {
        // Find which solution this entity belongs to
        const dependentSolution = allSolutions.find(
          sol => sol.publisherid.uniquename === entityPublisher
        );

        if (dependentSolution && dependentSolution.solutionid !== solution.solutionid) {
          // Check if we already have this dependency
          const existingDep = dependencies.find(
            dep => dep.dependsOnSolution === dependentSolution.friendlyname
          );

          if (existingDep) {
            existingDep.componentReferences.push(entity.entity.LogicalName);
          } else {
            dependencies.push({
              dependsOnSolution: dependentSolution.friendlyname,
              reason: 'References entities from this solution',
              componentReferences: [entity.entity.LogicalName],
            });
          }
        }
      }

      // Check for lookup dependencies (entity has lookup to entity in another solution)
      if (entity.entity.ManyToOneRelationships) {
        for (const rel of entity.entity.ManyToOneRelationships) {
          const refEntityPublisher = this.extractPublisherFromLogicalName(rel.ReferencedEntity);

          if (refEntityPublisher && refEntityPublisher !== currentPublisher) {
            const dependentSolution = allSolutions.find(
              sol => sol.publisherid.uniquename === refEntityPublisher
            );

            if (dependentSolution && dependentSolution.solutionid !== solution.solutionid) {
              const existingDep = dependencies.find(
                dep => dep.dependsOnSolution === dependentSolution.friendlyname
              );

              const reference = `${entity.entity.LogicalName} → ${rel.ReferencedEntity}`;

              if (existingDep) {
                if (!existingDep.componentReferences.includes(reference)) {
                  existingDep.componentReferences.push(reference);
                }
              } else {
                dependencies.push({
                  dependsOnSolution: dependentSolution.friendlyname,
                  reason: 'Has lookup relationships to entities in this solution',
                  componentReferences: [reference],
                });
              }
            }
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Extract publisher prefix from schema name
   */
  private extractPublisherPrefix(schemaName: string): string | null {
    const match = schemaName.match(/^([a-z]+)_/i);
    return match ? match[1] : null;
  }

  /**
   * Extract publisher prefix from logical name (less reliable than schema name)
   */
  private extractPublisherFromLogicalName(logicalName: string): string | null {
    const match = logicalName.match(/^([a-z]+)_/i);
    return match ? match[1] : null;
  }
}
