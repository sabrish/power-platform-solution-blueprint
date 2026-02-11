/**
 * MarkdownReporter - Generates complete markdown documentation for blueprints
 *
 * Generates a comprehensive file structure with:
 * - Root README with ERD and navigation
 * - Summary files (metrics, all-plugins, all-flows, etc.)
 * - Entity-specific documentation (overview, schema, automation, execution pipeline)
 * - Analysis files (complexity, performance risks, migration recommendations)
 */
import type {
  BlueprintResult,
  EntityBlueprint,
  FileNode,
  MarkdownExport,
  PluginStep,
  Flow,
  BusinessRule,
  WebResource,
  PerformanceRisk,
  CrossEntityLink,
  ExternalEndpoint,
  ERDDefinition,
  EntityQuickLink,
} from '../types/blueprint.js';
import type { ClassicWorkflow } from '../types/classicWorkflow.js';
import type { BusinessProcessFlow } from '../types/businessProcessFlow.js';
import type { CustomAPI } from '../types/customApi.js';
import MarkdownFormatter from './markdown/MarkdownFormatter.js';

export class MarkdownReporter {
  /**
   * Generate complete markdown export from blueprint result
   */
  generate(result: BlueprintResult): MarkdownExport {
    const files = new Map<string, string>();

    // Generate root README
    files.set('README.md', this.generateReadme(result));

    // Generate summary files
    files.set('summary/metrics.md', this.generateMetrics(result));
    files.set('summary/all-plugins.md', this.generateAllPlugins(result));
    files.set('summary/all-flows.md', this.generateAllFlows(result));
    files.set('summary/all-business-rules.md', this.generateAllBusinessRules(result));
    files.set('summary/all-classic-workflows.md', this.generateAllClassicWorkflows(result));
    files.set('summary/all-webresources.md', this.generateAllWebResources(result));
    files.set('summary/all-custom-apis.md', this.generateAllCustomAPIs(result));
    files.set('summary/all-environment-variables.md', this.generateAllEnvironmentVariables(result));
    files.set('summary/all-connection-references.md', this.generateAllConnectionReferences(result));
    files.set('summary/all-business-process-flows.md', this.generateAllBusinessProcessFlows(result));

    if (result.externalEndpoints && result.externalEndpoints.length > 0) {
      files.set('summary/external-integrations.md', this.generateExternalIntegrations(result));
    }

    if (result.crossEntityLinks && result.crossEntityLinks.length > 0) {
      files.set('summary/cross-entity-automation.md', this.generateCrossEntityAutomation(result));
    }

    if (result.solutionDistribution && result.solutionDistribution.length > 0) {
      files.set('summary/solution-distribution.md', this.generateSolutionDistribution(result));
    }

    // Generate security files
    if (result.securityRoles || result.fieldSecurityProfiles || result.attributeMaskingRules || result.columnSecurityProfiles) {
      files.set('security/overview.md', this.generateSecurityOverview(result));

      // Generate individual role pages
      if (result.securityRoles) {
        for (const role of result.securityRoles) {
          const roleName = role.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          files.set(`security/roles/${roleName}.md`, this.generateSecurityRoleDetail(role));
        }
      }

      // Generate field security profiles page
      if (result.fieldSecurityProfiles && result.fieldSecurityProfiles.length > 0) {
        files.set('security/field-security-profiles.md', this.generateFieldSecurityProfiles(result));
      }

      // Generate attribute masking rules page
      if (result.attributeMaskingRules && result.attributeMaskingRules.length > 0) {
        files.set('security/attribute-masking.md', this.generateAttributeMaskingRules(result));
      }

      // Generate column security profiles page
      if (result.columnSecurityProfiles && result.columnSecurityProfiles.length > 0) {
        files.set('security/column-security.md', this.generateColumnSecurityProfiles(result));
      }
    }

    // Generate entity-specific files
    for (const entity of result.entities) {
      const name = entity.entity.LogicalName;
      files.set(`entities/${name}/overview.md`, this.generateEntityOverview(entity, result));
      files.set(`entities/${name}/schema.md`, this.generateEntitySchema(entity));

      // Only generate automation.md if there's automation
      if (this.hasAutomation(entity, result)) {
        files.set(`entities/${name}/automation.md`, this.generateEntityAutomation(entity, result));
      }

      // Only generate execution pipeline if there's server-side automation
      if (this.hasExecutionPipeline(entity, result)) {
        files.set(`entities/${name}/execution-pipeline.md`, this.generateExecutionPipeline(entity, result));
      }

      // Only generate BPF file if entity has BPFs
      const bpfs = this.getEntityBpfs(entity.entity.LogicalName, result);
      if (bpfs.length > 0) {
        files.set(`entities/${name}/business-process-flows.md`, this.generateEntityBpfs(entity, bpfs));
      }
    }

    // Generate analysis files
    files.set('analysis/complexity-scores.md', this.generateComplexityScores(result));
    files.set('analysis/performance-risks.md', this.generatePerformanceRisks(result));
    files.set('analysis/migration-recommendations.md', this.generateMigrationRecommendations(result));

    // Calculate total size
    const totalSize = Array.from(files.values()).reduce(
      (sum, content) => sum + new TextEncoder().encode(content).length,
      0
    );

    // Build file tree structure
    const structure = this.buildFileTree(files);

    return {
      files,
      structure,
      totalFiles: files.size,
      totalSize,
    };
  }

  /**
   * Generate root README.md with ERD, legend, and navigation
   */
  private generateReadme(result: BlueprintResult): string {
    const sections: string[] = [];

    // Title and metadata
    sections.push(MarkdownFormatter.formatHeading('Power Platform Solution Blueprint', 1));
    sections.push('');
    sections.push(`**Generated:** ${result.metadata.generatedAt.toISOString()}`);
    sections.push(`**Environment:** ${result.metadata.environment}`);
    sections.push(`**Scope:** ${result.metadata.scope.description}`);
    sections.push('');
    sections.push(MarkdownFormatter.formatHorizontalRule());
    sections.push('');

    // ERD Section
    if (result.erd) {
      sections.push(MarkdownFormatter.formatHeading('Entity Relationship Diagram', 2));
      sections.push('');
      sections.push(this.generateERDSection(result.erd));
      sections.push('');
      sections.push(MarkdownFormatter.formatHorizontalRule());
      sections.push('');
    }

    // Quick metrics summary
    sections.push(MarkdownFormatter.formatHeading('Summary', 2));
    sections.push('');
    sections.push(this.generateQuickMetrics(result));
    sections.push('');
    sections.push(MarkdownFormatter.formatHorizontalRule());
    sections.push('');

    // Entity quick links
    if (result.erd && result.erd.entityQuickLinks.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Entities', 2));
      sections.push('');
      sections.push(this.generateEntityQuickLinksTable(result.erd.entityQuickLinks));
      sections.push('');
      sections.push(MarkdownFormatter.formatHorizontalRule());
      sections.push('');
    }

    // Navigation links
    sections.push(MarkdownFormatter.formatHeading('Documentation Structure', 2));
    sections.push('');
    sections.push(this.generateNavigationLinks());
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate ERD section with diagrams and legend
   */
  private generateERDSection(erd: ERDDefinition): string {
    const sections: string[] = [];

    // Publisher legend
    if (erd.legend.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Publisher Legend', 3));
      sections.push('');

      const headers = ['Publisher', 'Prefix', 'Entities', 'Color'];
      const rows = erd.legend.map(pub => [
        pub.publisherName,
        pub.publisherPrefix,
        pub.entityCount.toString(),
        pub.color,
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // Diagram - Use only the first diagram (comprehensive view) to match UI behavior
    if (erd.diagrams.length > 0) {
      const diagram = erd.diagrams[0];
      sections.push(MarkdownFormatter.formatHeading(diagram.title, 3));
      sections.push('');
      if (diagram.description) {
        sections.push(diagram.description);
        sections.push('');
      }
      sections.push(MarkdownFormatter.formatCodeBlock(diagram.mermaidDiagram, 'mermaid'));
      sections.push('');
    }

    // Warnings
    if (erd.warnings && erd.warnings.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Diagram Warnings', 3));
      sections.push('');
      sections.push(MarkdownFormatter.formatList(erd.warnings.map(w => `⚠️ ${w}`)));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate quick metrics summary
   */
  private generateQuickMetrics(result: BlueprintResult): string {
    const items: string[] = [];

    items.push(`**${result.summary.totalEntities}** Entities`);
    items.push(`**${result.summary.totalPlugins}** Plugins (${result.summary.totalPluginPackages} assemblies)`);
    items.push(`**${result.summary.totalFlows}** Cloud Flows`);
    items.push(`**${result.summary.totalBusinessRules}** Business Rules`);
    items.push(`**${result.summary.totalClassicWorkflows}** Classic Workflows ⚠️`);
    items.push(`**${result.summary.totalBusinessProcessFlows}** Business Process Flows`);
    items.push(`**${result.summary.totalWebResources}** Web Resources`);
    items.push(`**${result.summary.totalCustomAPIs}** Custom APIs`);
    items.push(`**${result.summary.totalEnvironmentVariables}** Environment Variables`);
    items.push(`**${result.summary.totalConnectionReferences}** Connection References`);
    items.push(`**${result.summary.totalSecurityRoles}** Security Roles`);
    items.push(`**${result.summary.totalFieldSecurityProfiles}** Field Security Profiles`);

    return MarkdownFormatter.formatList(items);
  }

  /**
   * Generate entity quick links table
   */
  private generateEntityQuickLinksTable(links: EntityQuickLink[]): string {
    const headers = ['Entity', 'Publisher', 'Fields', 'Plugins', 'Flows', 'Rules', 'Complexity'];
    const rows = links.map(link => [
      MarkdownFormatter.formatLink(link.displayName, `entities/${link.logicalName}/overview.md`),
      link.publisherPrefix,
      link.fieldCount.toString(),
      link.pluginCount.toString(),
      link.flowCount.toString(),
      link.businessRuleCount.toString(),
      this.formatComplexityBadge(link.complexity),
    ]);

    return MarkdownFormatter.formatTable(headers, rows);
  }

  /**
   * Generate navigation links
   */
  private generateNavigationLinks(): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Summary', 3));
    sections.push('');
    sections.push(MarkdownFormatter.formatList([
      MarkdownFormatter.formatLink('Metrics & Statistics', 'summary/metrics.md'),
      MarkdownFormatter.formatLink('All Plugins', 'summary/all-plugins.md'),
      MarkdownFormatter.formatLink('All Flows', 'summary/all-flows.md'),
      MarkdownFormatter.formatLink('All Business Rules', 'summary/all-business-rules.md'),
      MarkdownFormatter.formatLink('All Classic Workflows', 'summary/all-classic-workflows.md'),
      MarkdownFormatter.formatLink('All Web Resources', 'summary/all-webresources.md'),
      MarkdownFormatter.formatLink('All Custom APIs', 'summary/all-custom-apis.md'),
      MarkdownFormatter.formatLink('All Environment Variables', 'summary/all-environment-variables.md'),
      MarkdownFormatter.formatLink('All Connection References', 'summary/all-connection-references.md'),
      MarkdownFormatter.formatLink('All Business Process Flows', 'summary/all-business-process-flows.md'),
      MarkdownFormatter.formatLink('External Integrations', 'summary/external-integrations.md'),
      MarkdownFormatter.formatLink('Cross-Entity Automation', 'summary/cross-entity-automation.md'),
      MarkdownFormatter.formatLink('Solution Distribution', 'summary/solution-distribution.md'),
    ]));
    sections.push('');

    sections.push(MarkdownFormatter.formatHeading('Security', 3));
    sections.push('');
    sections.push(MarkdownFormatter.formatList([
      MarkdownFormatter.formatLink('Security Overview', 'security/overview.md'),
      MarkdownFormatter.formatLink('Field Security Profiles', 'security/field-security-profiles.md'),
      MarkdownFormatter.formatLink('Attribute Masking Rules', 'security/attribute-masking.md'),
      MarkdownFormatter.formatLink('Column Security Profiles', 'security/column-security.md'),
    ]));
    sections.push('');

    sections.push(MarkdownFormatter.formatHeading('Analysis', 3));
    sections.push('');
    sections.push(MarkdownFormatter.formatList([
      MarkdownFormatter.formatLink('Complexity Scores', 'analysis/complexity-scores.md'),
      MarkdownFormatter.formatLink('Performance Risks', 'analysis/performance-risks.md'),
      MarkdownFormatter.formatLink('Migration Recommendations', 'analysis/migration-recommendations.md'),
    ]));
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate summary/metrics.md
   */
  private generateMetrics(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Blueprint Metrics & Statistics', 1));
    sections.push('');

    // Overall counts
    sections.push(MarkdownFormatter.formatHeading('Component Counts', 2));
    sections.push('');
    const headers = ['Component Type', 'Count'];
    const rows = [
      ['Entities', result.summary.totalEntities.toString()],
      ['Attributes (Fields)', result.summary.totalAttributes.toString()],
      ['Plugins', result.summary.totalPlugins.toString()],
      ['Plugin Assemblies', result.summary.totalPluginPackages.toString()],
      ['Cloud Flows', result.summary.totalFlows.toString()],
      ['Business Rules', result.summary.totalBusinessRules.toString()],
      ['Classic Workflows', result.summary.totalClassicWorkflows.toString()],
      ['Business Process Flows', result.summary.totalBusinessProcessFlows.toString()],
      ['Web Resources', result.summary.totalWebResources.toString()],
      ['Custom APIs', result.summary.totalCustomAPIs.toString()],
      ['Environment Variables', result.summary.totalEnvironmentVariables.toString()],
      ['Connection References', result.summary.totalConnectionReferences.toString()],
      ['Global Choices', result.summary.totalGlobalChoices.toString()],
      ['Custom Connectors', result.summary.totalCustomConnectors.toString()],
      ['Security Roles', result.summary.totalSecurityRoles.toString()],
      ['Field Security Profiles', result.summary.totalFieldSecurityProfiles.toString()],
      ['Canvas Apps', result.summary.totalCanvasApps.toString()],
      ['Custom Pages', result.summary.totalCustomPages.toString()],
    ];
    sections.push(MarkdownFormatter.formatTable(headers, rows));
    sections.push('');

    // External calls summary
    if (result.externalEndpoints && result.externalEndpoints.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('External Integration Summary', 2));
      sections.push('');
      sections.push(`**Total External Endpoints:** ${result.externalEndpoints.length}`);
      sections.push('');

      const pluginsWithCalls = result.plugins.filter(() => {
        // Check if plugin has external calls (would need to be tracked in discovery)
        return false; // Placeholder - would need actual external call detection
      }).length;

      const flowsWithCalls = result.flows.filter(f => f.hasExternalCalls).length;

      sections.push(`- Plugins with external calls: ${pluginsWithCalls}`);
      sections.push(`- Flows with external calls: ${flowsWithCalls}`);
      sections.push('');

      sections.push(MarkdownFormatter.formatLink('View detailed external integrations', 'external-integrations.md'));
      sections.push('');
    }

    // Performance risk summary
    const allRisks: PerformanceRisk[] = [];
    for (const entity of result.entities) {
      if (entity.performanceRisks) {
        allRisks.push(...entity.performanceRisks);
      }
    }

    if (allRisks.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Performance Risk Summary', 2));
      sections.push('');

      const critical = allRisks.filter(r => r.severity === 'Critical').length;
      const high = allRisks.filter(r => r.severity === 'High').length;
      const medium = allRisks.filter(r => r.severity === 'Medium').length;
      const low = allRisks.filter(r => r.severity === 'Low').length;

      sections.push(`- ${MarkdownFormatter.formatBadge(`${critical} Critical`, 'error')}`);
      sections.push(`- ${MarkdownFormatter.formatBadge(`${high} High`, 'error')}`);
      sections.push(`- ${MarkdownFormatter.formatBadge(`${medium} Medium`, 'warning')}`);
      sections.push(`- ${MarkdownFormatter.formatBadge(`${low} Low`, 'info')}`);
      sections.push('');

      sections.push(MarkdownFormatter.formatLink('View detailed performance analysis', '../analysis/performance-risks.md'));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-plugins.md
   */
  private generateAllPlugins(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Plugins', 1));
    sections.push('');
    sections.push(`**Total Plugins:** ${result.summary.totalPlugins}`);
    sections.push(`**Total Assemblies:** ${result.summary.totalPluginPackages}`);
    sections.push('');

    if (result.plugins.length === 0) {
      sections.push('No plugins found in this scope.');
      return sections.join('\n');
    }

    // Group by assembly -> entity -> message
    const grouped = this.groupPluginsByAssembly(result.plugins);

    for (const [assemblyName, entities] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(assemblyName, 2));
      sections.push('');

      for (const [entityName, plugins] of entities) {
        sections.push(MarkdownFormatter.formatHeading(entityName, 3));
        sections.push('');

        const headers = ['Name', 'Message', 'Stage', 'Mode', 'Rank', 'External', 'Solution', 'Description'];
        const rows = plugins.map(plugin => [
          plugin.name,
          plugin.message,
          plugin.stageName,
          plugin.modeName,
          plugin.rank.toString(),
          this.hasExternalCalls(plugin) ? '🌐' : '',
          this.getPluginSolution(plugin, result),
          plugin.description || '',
        ]);

        sections.push(MarkdownFormatter.formatTable(headers, rows));
        sections.push('');
      }
    }

    // Performance warnings
    const syncWithExternal = result.plugins.filter(p =>
      p.modeName === 'Synchronous' && this.hasExternalCalls(p)
    );

    if (syncWithExternal.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('⚠️ Performance Warnings', 2));
      sections.push('');
      sections.push('The following synchronous plugins may have external calls, which can impact performance:');
      sections.push('');

      const warnHeaders = ['Plugin', 'Entity', 'Message', 'Stage'];
      const warnRows = syncWithExternal.map(p => [
        p.name,
        p.entity,
        p.message,
        p.stageName,
      ]);

      sections.push(MarkdownFormatter.formatTable(warnHeaders, warnRows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-flows.md
   */
  private generateAllFlows(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Cloud Flows', 1));
    sections.push('');
    sections.push(`**Total Flows:** ${result.summary.totalFlows}`);
    sections.push('');

    if (result.flows.length === 0) {
      sections.push('No flows found in this scope.');
      return sections.join('\n');
    }

    // Group by entity -> trigger type
    const grouped = this.groupFlowsByEntity(result.flows);

    for (const [entityName, flows] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(entityName || 'Manual/Scheduled Flows', 2));
      sections.push('');

      const headers = ['Name', 'Trigger', 'Scope', 'State', 'External', 'Owner', 'Modified', 'Description'];
      const rows = flows.map(flow => [
        flow.name,
        `${flow.definition.triggerType} (${flow.definition.triggerEvent})`,
        flow.scopeName,
        this.formatFlowStateBadge(flow.state),
        flow.hasExternalCalls ? '🌐' : '',
        flow.owner,
        this.formatDate(flow.modifiedOn),
        flow.description || '',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-business-rules.md
   */
  private generateAllBusinessRules(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Business Rules', 1));
    sections.push('');
    sections.push(`**Total Business Rules:** ${result.summary.totalBusinessRules}`);
    sections.push('');

    if (result.businessRules.length === 0) {
      sections.push('No business rules found in this scope.');
      return sections.join('\n');
    }

    // Group by entity
    const grouped = this.groupBusinessRulesByEntity(result.businessRules);

    for (const [entityName, rules] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(entityName, 2));
      sections.push('');

      const headers = ['Name', 'Scope', 'Context', 'State', 'Conditions', 'Actions', 'Modified'];
      const rows = rules.map(rule => [
        rule.name,
        rule.scopeName,
        rule.definition.executionContext,
        rule.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning'),
        rule.definition.conditions.length.toString(),
        rule.definition.actions.length.toString(),
        this.formatDate(rule.modifiedOn),
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-classic-workflows.md
   */
  private generateAllClassicWorkflows(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Classic Workflows', 1));
    sections.push('');
    sections.push('⚠️ **Classic workflows are deprecated and require migration to Power Automate.**');
    sections.push('');
    sections.push(`**Total Classic Workflows:** ${result.summary.totalClassicWorkflows}`);
    sections.push('');

    if (result.classicWorkflows.length === 0) {
      sections.push('No classic workflows found in this scope.');
      return sections.join('\n');
    }

    // Group by entity
    const grouped = this.groupClassicWorkflowsByEntity(result.classicWorkflows);

    for (const [entityName, workflows] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(entityName, 2));
      sections.push('');

      const headers = ['Name', 'Type', 'Mode', 'Triggers', 'State', 'Migration', 'Modified', 'Description'];
      const rows = workflows.map(wf => [
        wf.name,
        wf.typeName,
        wf.modeName,
        this.formatWorkflowTriggers(wf),
        wf.state,
        wf.migrationRecommendation?.complexity || 'Unknown',
        this.formatDate(wf.modifiedOn),
        wf.description || '',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    sections.push(MarkdownFormatter.formatHeading('Migration Required', 2));
    sections.push('');
    sections.push('See ' + MarkdownFormatter.formatLink('Migration Recommendations', '../analysis/migration-recommendations.md') + ' for detailed migration guidance.');
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate summary/all-webresources.md
   */
  private generateAllWebResources(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Web Resources', 1));
    sections.push('');
    sections.push(`**Total Web Resources:** ${result.summary.totalWebResources}`);
    sections.push('');

    if (result.webResources.length === 0) {
      sections.push('No web resources found in this scope.');
      return sections.join('\n');
    }

    // Group by type
    const grouped = this.groupWebResourcesByType(result.webResources);

    for (const [typeName, resources] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(`${typeName} Files`, 2));
      sections.push('');

      const headers = ['Name', 'Display Name', 'Size', 'External Calls', 'Deprecated', 'Modified', 'Description'];
      const rows = resources.map(wr => [
        wr.name,
        wr.displayName,
        this.formatFileSize(wr.contentSize),
        wr.hasExternalCalls ? '🌐' : '',
        wr.isDeprecated ? '⚠️ Yes' : '',
        this.formatDate(wr.modifiedOn),
        wr.description || '',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // JavaScript analysis summary
    const jsResources = result.webResources.filter(wr => wr.typeName === 'JavaScript' && wr.analysis);
    if (jsResources.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('JavaScript Analysis', 2));
      sections.push('');

      const deprecatedCount = jsResources.filter(wr => wr.isDeprecated).length;
      const externalCallsCount = jsResources.filter(wr => wr.hasExternalCalls).length;
      const highComplexityCount = jsResources.filter(wr => wr.analysis?.complexity === 'High').length;

      sections.push(`- Using deprecated Xrm.Page API: **${deprecatedCount}** files`);
      sections.push(`- With external API calls: **${externalCallsCount}** files`);
      sections.push(`- High complexity: **${highComplexityCount}** files`);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-custom-apis.md
   */
  private generateAllCustomAPIs(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Custom APIs', 1));
    sections.push('');
    sections.push(`**Total Custom APIs:** ${result.summary.totalCustomAPIs}`);
    sections.push('');

    if (result.customAPIs.length === 0) {
      sections.push('No custom APIs found in this scope.');
      return sections.join('\n');
    }

    // Group by binding type
    const grouped = this.groupCustomAPIsByBinding(result.customAPIs);

    for (const [bindingType, apis] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(`${bindingType} APIs`, 2));
      sections.push('');

      const headers = ['Name', 'Type', 'Bound Entity', 'Private', 'Parameters', 'Responses', 'Modified'];
      const rows = apis.map(api => [
        api.uniqueName,
        api.isFunction ? 'Function' : 'Action',
        api.boundEntityLogicalName || 'N/A',
        api.isPrivate ? 'Yes' : 'No',
        api.requestParameters.length.toString(),
        api.responseProperties.length.toString(),
        this.formatDate(api.modifiedOn),
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-environment-variables.md
   */
  private generateAllEnvironmentVariables(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Environment Variables', 1));
    sections.push('');
    sections.push(`**Total Environment Variables:** ${result.summary.totalEnvironmentVariables}`);
    sections.push('');

    if (result.environmentVariables.length === 0) {
      sections.push('No environment variables found in this scope.');
      return sections.join('\n');
    }

    const headers = ['Schema Name', 'Type', 'Required', 'Has Value', 'Modified'];
    const rows = result.environmentVariables.map(env => [
      env.schemaName,
      env.typeName,
      env.isRequired ? 'Yes' : 'No',
      env.currentValue ? 'Yes' : 'No',
      this.formatDate(env.modifiedOn),
    ]);

    sections.push(MarkdownFormatter.formatTable(headers, rows));
    sections.push('');

    // Missing values warning
    const missingValues = result.environmentVariables.filter(env => env.isRequired && !env.currentValue);
    if (missingValues.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('⚠️ Missing Required Values', 2));
      sections.push('');
      sections.push('The following required environment variables have no current value:');
      sections.push('');
      sections.push(MarkdownFormatter.formatList(missingValues.map(env => env.schemaName)));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/all-connection-references.md
   */
  private generateAllConnectionReferences(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Connection References', 1));
    sections.push('');
    sections.push(`**Total Connection References:** ${result.summary.totalConnectionReferences}`);
    sections.push('');

    if (result.connectionReferences.length === 0) {
      sections.push('No connection references found in this scope.');
      return sections.join('\n');
    }

    const headers = ['Name', 'Connector', 'Status', 'Modified'];
    const rows = result.connectionReferences.map(conn => [
      conn.displayName,
      conn.connectorDisplayName || 'Unknown',
      conn.connectionId ? MarkdownFormatter.formatBadge('Connected', 'success') : MarkdownFormatter.formatBadge('Not Connected', 'error'),
      this.formatDate(conn.modifiedOn),
    ]);

    sections.push(MarkdownFormatter.formatTable(headers, rows));
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate summary/all-business-process-flows.md
   */
  private generateAllBusinessProcessFlows(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('All Business Process Flows', 1));
    sections.push('');
    sections.push(`**Total Business Process Flows:** ${result.summary.totalBusinessProcessFlows}`);
    sections.push('');

    if (result.businessProcessFlows.length === 0) {
      sections.push('No business process flows found in this scope.');
      return sections.join('\n');
    }

    // Group by primary entity
    const grouped = this.groupBpfsByEntity(result.businessProcessFlows);

    for (const [entityName, bpfs] of grouped) {
      sections.push(MarkdownFormatter.formatHeading(entityName, 2));
      sections.push('');

      const headers = ['Name', 'Stages', 'Entities', 'Cross-Entity', 'State', 'Modified'];
      const rows = bpfs.map(bpf => [
        bpf.name,
        bpf.definition.stages.length.toString(),
        bpf.definition.entities.join(', '),
        bpf.definition.crossEntityFlow ? 'Yes' : 'No',
        bpf.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning'),
        this.formatDate(bpf.modifiedOn),
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/external-integrations.md
   */
  private generateExternalIntegrations(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('External Integrations', 1));
    sections.push('');

    if (!result.externalEndpoints || result.externalEndpoints.length === 0) {
      sections.push('No external integrations detected.');
      return sections.join('\n');
    }

    sections.push(`**Total External Endpoints:** ${result.externalEndpoints.length}`);
    sections.push('');

    // Group by risk level
    const byRisk = new Map<string, ExternalEndpoint[]>();
    for (const endpoint of result.externalEndpoints) {
      const risk = endpoint.riskLevel;
      if (!byRisk.has(risk)) {
        byRisk.set(risk, []);
      }
      byRisk.get(risk)!.push(endpoint);
    }

    for (const [riskLevel, endpoints] of byRisk) {
      sections.push(MarkdownFormatter.formatHeading(`${riskLevel} Risk Endpoints`, 2));
      sections.push('');

      const headers = ['Domain', 'Protocol', 'Calls', 'Detected In'];
      const rows = endpoints.map(ep => [
        ep.domain,
        ep.protocol.toUpperCase(),
        ep.callCount.toString(),
        ep.detectedIn.length.toString() + ' components',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/cross-entity-automation.md
   */
  private generateCrossEntityAutomation(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Cross-Entity Automation', 1));
    sections.push('');

    if (!result.crossEntityLinks || result.crossEntityLinks.length === 0) {
      sections.push('> **Note:** Cross-entity automation analysis is coming in a future update.');
      return sections.join('\n');
    }

    sections.push(`**Total Cross-Entity Links:** ${result.crossEntityLinks.length}`);
    sections.push('');

    // Group by automation type
    const byType = new Map<string, CrossEntityLink[]>();
    for (const link of result.crossEntityLinks) {
      if (!byType.has(link.automationType)) {
        byType.set(link.automationType, []);
      }
      byType.get(link.automationType)!.push(link);
    }

    for (const [type, links] of byType) {
      sections.push(MarkdownFormatter.formatHeading(type, 2));
      sections.push('');

      const headers = ['Source Entity', 'Target Entity', 'Automation', 'Operation', 'Mode'];
      const rows = links.map(link => [
        link.sourceEntityDisplayName,
        link.targetEntityDisplayName,
        link.automationName,
        link.operation,
        link.isAsynchronous ? 'Async' : 'Sync',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate summary/solution-distribution.md
   */
  private generateSolutionDistribution(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Solution Distribution', 1));
    sections.push('');

    if (!result.solutionDistribution || result.solutionDistribution.length === 0) {
      sections.push('No solution distribution information available.');
      return sections.join('\n');
    }

    for (const solution of result.solutionDistribution) {
      sections.push(MarkdownFormatter.formatHeading(solution.solutionName, 2));
      sections.push('');
      sections.push(`**Publisher:** ${solution.publisher}`);
      sections.push(`**Version:** ${solution.version}`);
      sections.push(`**Managed:** ${solution.isManaged ? 'Yes' : 'No'}`);
      sections.push('');

      sections.push(MarkdownFormatter.formatHeading('Component Distribution', 3));
      sections.push('');

      const headers = ['Component Type', 'Count'];
      const rows = [
        ['Entities', solution.componentCounts.entities.toString()],
        ['Plugins', solution.componentCounts.plugins.toString()],
        ['Flows', solution.componentCounts.flows.toString()],
        ['Business Rules', solution.componentCounts.businessRules.toString()],
        ['Classic Workflows', solution.componentCounts.classicWorkflows.toString()],
        ['Business Process Flows', solution.componentCounts.bpfs.toString()],
        ['Web Resources', solution.componentCounts.webResources.toString()],
        ['Custom APIs', solution.componentCounts.customAPIs.toString()],
        ['Environment Variables', solution.componentCounts.environmentVariables.toString()],
        ['Connection References', solution.componentCounts.connectionReferences.toString()],
        ['Global Choices', solution.componentCounts.globalChoices.toString()],
      ];

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate entities/{entity}/overview.md
   */
  private generateEntityOverview(entity: EntityBlueprint, result: BlueprintResult): string {
    const sections: string[] = [];
    const meta = entity.entity;
    const displayName = meta.DisplayName?.UserLocalizedLabel?.Label || meta.LogicalName;

    sections.push(MarkdownFormatter.formatHeading(`${displayName} - Overview`, 1));
    sections.push('');

    // Quick stats card
    sections.push(MarkdownFormatter.formatHeading('Quick Stats', 2));
    sections.push('');
    sections.push(`- **Logical Name:** ${meta.LogicalName}`);
    sections.push(`- **Schema Name:** ${meta.SchemaName}`);
    sections.push(`- **Primary ID:** ${meta.PrimaryIdAttribute}`);
    sections.push(`- **Primary Name:** ${meta.PrimaryNameAttribute}`);
    sections.push(`- **Custom Entity:** ${meta.IsCustomEntity ? 'Yes' : 'No'}`);
    sections.push(`- **Managed:** ${meta.IsManaged ? 'Yes' : 'No'}`);
    sections.push('');
    sections.push(`- **Total Attributes:** ${meta.Attributes?.length || 0}`);
    sections.push(`- **Plugins:** ${entity.plugins.length}`);
    sections.push(`- **Flows:** ${entity.flows.length}`);
    sections.push(`- **Business Rules:** ${entity.businessRules.length}`);
    sections.push(`- **Forms:** ${entity.forms.length}`);
    sections.push('');

    // Navigation links
    sections.push(MarkdownFormatter.formatHeading('Documentation', 2));
    sections.push('');

    const navLinks = [MarkdownFormatter.formatLink('Schema & Fields', 'schema.md')];

    // Only add automation link if there's automation
    if (this.hasAutomation(entity, result)) {
      navLinks.push(MarkdownFormatter.formatLink('Automation Details', 'automation.md'));
    }

    // Only add execution pipeline link if there's server-side automation
    if (this.hasExecutionPipeline(entity, result)) {
      navLinks.push(MarkdownFormatter.formatLink('Execution Pipeline', 'execution-pipeline.md'));
    }

    // Only add BPF link if there are BPFs
    const bpfs = this.getEntityBpfs(entity.entity.LogicalName, result);
    if (bpfs.length > 0) {
      navLinks.push(MarkdownFormatter.formatLink('Business Process Flows', 'business-process-flows.md'));
    }

    sections.push(MarkdownFormatter.formatList(navLinks));
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate entities/{entity}/schema.md
   */
  private generateEntitySchema(entity: EntityBlueprint): string {
    const sections: string[] = [];
    const meta = entity.entity;
    const displayName = meta.DisplayName?.UserLocalizedLabel?.Label || meta.LogicalName;

    sections.push(MarkdownFormatter.formatHeading(`${displayName} - Schema`, 1));
    sections.push('');

    // Entity description
    const entityDescription = meta.Description?.UserLocalizedLabel?.Label;
    if (entityDescription) {
      sections.push(entityDescription);
      sections.push('');
    }

    // Attributes table
    sections.push(MarkdownFormatter.formatHeading('Attributes', 2));
    sections.push('');

    if (meta.Attributes && meta.Attributes.length > 0) {
      const headers = ['Logical Name', 'Display Name', 'Type', 'Required', 'Custom', 'Description'];
      const rows = meta.Attributes.map(attr => [
        attr.LogicalName,
        attr.DisplayName?.UserLocalizedLabel?.Label || '',
        attr.AttributeType,
        attr.RequiredLevel.Value,
        attr.IsCustomAttribute ? 'Yes' : 'No',
        attr.Description?.UserLocalizedLabel?.Label || '',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    } else {
      sections.push('No attributes found.');
      sections.push('');
    }

    // Relationships
    if (meta.ManyToOneRelationships && meta.ManyToOneRelationships.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Many-to-One Relationships (Lookups)', 2));
      sections.push('');

      const headers = ['Schema Name', 'Referenced Entity', 'Referencing Attribute', 'Custom'];
      const rows = meta.ManyToOneRelationships.map(rel => [
        rel.SchemaName,
        rel.ReferencedEntity,
        rel.ReferencingAttribute,
        rel.IsCustomRelationship ? 'Yes' : 'No',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    if (meta.OneToManyRelationships && meta.OneToManyRelationships.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('One-to-Many Relationships', 2));
      sections.push('');

      const headers = ['Schema Name', 'Referencing Entity', 'Referencing Attribute', 'Custom'];
      const rows = meta.OneToManyRelationships.map(rel => [
        rel.SchemaName,
        rel.ReferencingEntity,
        rel.ReferencingAttribute,
        rel.IsCustomRelationship ? 'Yes' : 'No',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    if (meta.ManyToManyRelationships && meta.ManyToManyRelationships.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Many-to-Many Relationships', 2));
      sections.push('');

      const headers = ['Schema Name', 'Entity 1', 'Entity 2', 'Intersect Table', 'Custom'];
      const rows = meta.ManyToManyRelationships.map(rel => [
        rel.SchemaName,
        rel.Entity1LogicalName,
        rel.Entity2LogicalName,
        rel.IntersectEntityName,
        rel.IsCustomRelationship ? 'Yes' : 'No',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // Keys
    if (meta.Keys && meta.Keys.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Alternate Keys', 2));
      sections.push('');

      const headers = ['Logical Name', 'Key Attributes', 'Status'];
      const rows = meta.Keys.map(key => [
        key.LogicalName,
        key.KeyAttributes.join(', '),
        key.EntityKeyIndexStatus || 'Unknown',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // Field Security
    if (entity.fieldSecurity && entity.fieldSecurity.securedFields.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Field Security', 2));
      sections.push('');
      sections.push(`This entity has **${entity.fieldSecurity.securedFields.length}** secured field(s) with field-level permissions.`);
      sections.push('');

      const headers = ['Field', 'Profiles with Access'];
      const rows: string[][] = [];

      for (const securedField of entity.fieldSecurity.securedFields) {
        const profileNames = securedField.profiles.map(p => {
          const permissions = [];
          if (p.canRead) permissions.push('R');
          if (p.canCreate) permissions.push('C');
          if (p.canUpdate) permissions.push('U');
          return `${p.profileName} (${permissions.join(', ')})`;
        }).join('; ');

        rows.push([
          securedField.attributeLogicalName,
          profileNames,
        ]);
      }

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
      sections.push('**Permissions:** R = Read, C = Create, U = Update');
      sections.push('');
    }

    // Forms & Web Resources
    if (entity.forms && entity.forms.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Forms & Web Resources', 2));
      sections.push('');
      sections.push(`This entity has **${entity.forms.length}** form(s) with associated web resources and event handlers.`);
      sections.push('');

      for (const form of entity.forms) {
        sections.push(MarkdownFormatter.formatHeading(form.name, 3));
        sections.push('');
        sections.push(`**Type:** ${form.typeName}`);
        sections.push('');

        // Web Resources
        if (form.libraries.length > 0) {
          sections.push(MarkdownFormatter.formatHeading('Web Resources', 4));
          sections.push('');
          sections.push(MarkdownFormatter.formatList(form.libraries.map(lib => `\`${lib}\``)));
          sections.push('');
        }

        // Event Handlers
        if (form.eventHandlers.length > 0) {
          sections.push(MarkdownFormatter.formatHeading('Event Handlers', 4));
          sections.push('');

          const headers = ['Event', 'Library', 'Function', 'Status'];
          const rows = form.eventHandlers.map(handler => [
            handler.attribute ? `${handler.event} (${handler.attribute})` : handler.event,
            `\`${handler.libraryName}\``,
            handler.parameters ? `\`${handler.functionName}(${handler.parameters})\`` : `\`${handler.functionName}()\``,
            handler.enabled ? 'Enabled' : 'Disabled',
          ]);

          sections.push(MarkdownFormatter.formatTable(headers, rows));
          sections.push('');
        }
      }
    }

    return sections.join('\n');
  }

  /**
   * Generate entities/{entity}/automation.md
   */
  private generateEntityAutomation(entity: EntityBlueprint, result: BlueprintResult): string {
    const sections: string[] = [];
    const meta = entity.entity;
    const displayName = meta.DisplayName?.UserLocalizedLabel?.Label || meta.LogicalName;

    sections.push(MarkdownFormatter.formatHeading(`${displayName} - Automation`, 1));
    sections.push('');

    // Plugins
    if (entity.plugins.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Plugins', 2));
      sections.push('');

      const headers = ['Name', 'Message', 'Stage', 'Mode', 'Rank', 'Assembly'];
      const rows = entity.plugins.map(plugin => [
        plugin.name,
        plugin.message,
        plugin.stageName,
        plugin.modeName,
        plugin.rank.toString(),
        plugin.assemblyName,
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // Flows
    if (entity.flows.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Cloud Flows', 2));
      sections.push('');

      const headers = ['Name', 'Trigger', 'Scope', 'State', 'External'];
      const rows = entity.flows.map(flow => [
        flow.name,
        `${flow.definition.triggerType} (${flow.definition.triggerEvent})`,
        flow.scopeName,
        this.formatFlowStateBadge(flow.state),
        flow.hasExternalCalls ? '🌐' : '',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // Business Rules
    if (entity.businessRules.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Business Rules', 2));
      sections.push('');

      const headers = ['Name', 'Scope', 'Context', 'State', 'Conditions', 'Actions'];
      const rows = entity.businessRules.map(rule => [
        rule.name,
        rule.scopeName,
        rule.definition.executionContext,
        rule.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning'),
        rule.definition.conditions.length.toString(),
        rule.definition.actions.length.toString(),
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // JavaScript (from forms)
    if (entity.forms.length > 0) {
      const jsHandlers = entity.forms.flatMap(form => form.eventHandlers);

      if (jsHandlers.length > 0) {
        sections.push(MarkdownFormatter.formatHeading('JavaScript Event Handlers', 2));
        sections.push('');

        const headers = ['Event', 'Library', 'Function', 'Attribute', 'Enabled'];
        const rows = jsHandlers.map(handler => [
          handler.event,
          handler.libraryName,
          handler.functionName,
          handler.attribute || 'N/A',
          handler.enabled ? 'Yes' : 'No',
        ]);

        sections.push(MarkdownFormatter.formatTable(headers, rows));
        sections.push('');
      }
    }

    // Classic workflows
    const classicWorkflows = result.classicWorkflowsByEntity.get(meta.LogicalName) || [];
    if (classicWorkflows.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Classic Workflows (Deprecated)', 2));
      sections.push('');
      sections.push('⚠️ These workflows require migration to Power Automate.');
      sections.push('');

      const headers = ['Name', 'Type', 'Mode', 'Triggers', 'State'];
      const rows = classicWorkflows.map(wf => [
        wf.name,
        wf.typeName,
        wf.modeName,
        this.formatWorkflowTriggers(wf),
        wf.state,
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate entities/{entity}/execution-pipeline.md
   */
  private generateExecutionPipeline(entity: EntityBlueprint, _result: BlueprintResult): string {
    const sections: string[] = [];
    const meta = entity.entity;
    const displayName = meta.DisplayName?.UserLocalizedLabel?.Label || meta.LogicalName;

    sections.push(MarkdownFormatter.formatHeading(`${displayName} - Execution Pipeline`, 1));
    sections.push('');
    sections.push('This page shows the execution order of server-side automation on this entity.');
    sections.push('');

    // Group plugins by message/event
    const pluginsByMessage = new Map<string, typeof entity.plugins>();
    for (const plugin of entity.plugins) {
      const key = plugin.message;
      if (!pluginsByMessage.has(key)) {
        pluginsByMessage.set(key, []);
      }
      pluginsByMessage.get(key)!.push(plugin);
    }

    // If no plugins, show business rules and flows
    if (entity.plugins.length === 0) {
      sections.push('**No plugins registered on this entity.**');
      sections.push('');

      // Show business rules
      if (entity.businessRules.length > 0) {
        sections.push(MarkdownFormatter.formatHeading('Business Rules', 2));
        sections.push('');
        const headers = ['Name', 'Scope', 'State'];
        const rows = entity.businessRules.map(br => [
          br.name,
          br.scopeName,
          br.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning'),
        ]);
        sections.push(MarkdownFormatter.formatTable(headers, rows));
        sections.push('');
      }

      // Show Dataverse flows
      const dataverseFlows = entity.flows.filter(f => f.definition.triggerType === 'Dataverse');
      if (dataverseFlows.length > 0) {
        sections.push(MarkdownFormatter.formatHeading('Dataverse Flows', 2));
        sections.push('');
        const headers = ['Name', 'Trigger Event', 'Scope'];
        const rows = dataverseFlows.map(flow => [
          flow.name,
          flow.definition.triggerEvent,
          flow.scopeName,
        ]);
        sections.push(MarkdownFormatter.formatTable(headers, rows));
        sections.push('');
      }

      return sections.join('\n');
    }

    // Get entity-scoped business rules (they run server-side)
    const entityScopedBRs = entity.businessRules.filter(br => br.scopeName === 'Entity');

    // Generate execution order for each message
    for (const [message, plugins] of pluginsByMessage) {
      sections.push(MarkdownFormatter.formatHeading(`${message} Event`, 2));
      sections.push('');

      // Sort plugins by stage then rank
      const sortedPlugins = [...plugins].sort((a, b) => {
        if (a.stage !== b.stage) return a.stage - b.stage;
        return a.rank - b.rank;
      });

      // Group by stage
      const byStage = new Map<number, typeof sortedPlugins>();
      for (const plugin of sortedPlugins) {
        if (!byStage.has(plugin.stage)) {
          byStage.set(plugin.stage, []);
        }
        byStage.get(plugin.stage)!.push(plugin);
      }

      // Generate ASCII visualization including business rules
      sections.push(MarkdownFormatter.formatCodeBlock(
        this.generateSimplePipelineASCII(byStage, entityScopedBRs),
        'text'
      ));
      sections.push('');

      // Detailed table
      sections.push(MarkdownFormatter.formatHeading('Execution Details', 3));
      sections.push('');

      const headers = ['Order', 'Type', 'Name', 'Stage/Details', 'Mode', 'Rank'];
      const rows: string[][] = [];

      // Add business rules first
      // Note: Entity-scoped business rules run server-side as synchronous plugins,
      // but Microsoft doesn't explicitly document their exact pipeline stage.
      // They likely execute early (PreValidation or similar) as validation logic.
      if (entityScopedBRs.length > 0) {
        entityScopedBRs.forEach((br) => {
          rows.push([
            (rows.length + 1).toString(),
            'Business Rule',
            br.name,
            'Server-side (Entity scope)',
            br.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning'),
            '-',
          ]);
        });
      }

      // Add plugins
      sortedPlugins.forEach((plugin) => {
        rows.push([
          (rows.length + 1).toString(),
          'Plugin',
          plugin.name,
          plugin.stageName,
          plugin.modeName,
          plugin.rank.toString(),
        ]);
      });

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');

      // Check for sync plugins (potential performance impact)
      const syncPlugins = sortedPlugins.filter(p => p.mode === 0);
      if (syncPlugins.length > 0) {
        sections.push(MarkdownFormatter.formatHeading('ℹ️ Synchronous Plugins', 3));
        sections.push('');
        sections.push(`${syncPlugins.length} synchronous plugin(s) execute in this pipeline. Synchronous plugins block the transaction and should complete quickly.`);
        sections.push('');
      }
    }

    // Show business rules if any
    if (entity.businessRules.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Business Rules', 2));
      sections.push('');
      sections.push('Business rules execute on the client (form) or server depending on their scope.');
      sections.push('');
      const headers = ['Name', 'Scope', 'Context', 'State'];
      const rows = entity.businessRules.map(br => [
        br.name,
        br.scopeName,
        br.definition.executionContext,
        br.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning'),
      ]);
      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // Show Dataverse flows
    const dataverseFlows = entity.flows.filter(f => f.definition.triggerType === 'Dataverse');
    if (dataverseFlows.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Dataverse Flows (Real-time)', 2));
      sections.push('');
      sections.push('These flows trigger when data changes occur.');
      sections.push('');
      const headers = ['Name', 'Trigger Event', 'Scope', 'State'];
      const rows = dataverseFlows.map(flow => [
        flow.name,
        flow.definition.triggerEvent,
        flow.scopeName,
        this.formatFlowStateBadge(flow.state),
      ]);
      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate simple ASCII visualization of plugin execution pipeline
   */
  private generateSimplePipelineASCII(byStage: Map<number, any[]>, businessRules: BusinessRule[]): string {
    const lines: string[] = [];
    lines.push('Execution Order:');
    lines.push('');

    // Add business rules first (server-side entity-scoped rules execute early in pipeline)
    if (businessRules.length > 0) {
      lines.push('┌─ Business Rules (Server-side, Entity-scoped)');
      lines.push('│');
      for (let i = 0; i < businessRules.length; i++) {
        const br = businessRules[i];
        const isLast = i === businessRules.length - 1 && byStage.size === 0;
        const prefix = isLast ? '└─' : '├─';
        const state = br.state === 'Active' ? '[ACTIVE]' : '[DRAFT]';
        lines.push(`${prefix} ${i + 1}. ${br.name} ${state}`);
        if (!isLast) {
          lines.push('│');
        }
      }
      lines.push('');
    }

    // Add plugin stages
    let stageIndex = 0;
    for (const [stage, plugins] of byStage) {
      const stageName = plugins[0].stageName;
      const isLastStage = stageIndex === byStage.size - 1;

      lines.push(`┌─ Stage ${stage}: ${stageName}`);
      lines.push('│');

      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        const isLastPlugin = i === plugins.length - 1;
        const prefix = isLastPlugin && isLastStage ? '└─' : '├─';
        const mode = plugin.mode === 0 ? '[SYNC]' : '[ASYNC]';
        lines.push(`${prefix} ${i + 1}. ${plugin.name} ${mode}`);
        if (!isLastPlugin || !isLastStage) {
          lines.push('│   (Rank: ' + plugin.rank + ')');
        } else {
          lines.push('    (Rank: ' + plugin.rank + ')');
        }
        if (!isLastPlugin) {
          lines.push('│');
        }
      }

      lines.push('');
      stageIndex++;
    }

    return lines.join('\n');
  }

  /**
   * Generate entities/{entity}/business-process-flows.md
   */
  private generateEntityBpfs(entity: EntityBlueprint, bpfs: BusinessProcessFlow[]): string {
    const sections: string[] = [];
    const meta = entity.entity;
    const displayName = meta.DisplayName?.UserLocalizedLabel?.Label || meta.LogicalName;

    sections.push(MarkdownFormatter.formatHeading(`${displayName} - Business Process Flows`, 1));
    sections.push('');

    for (const bpf of bpfs) {
      sections.push(MarkdownFormatter.formatHeading(bpf.name, 2));
      sections.push('');

      if (bpf.description) {
        sections.push(bpf.description);
        sections.push('');
      }

      sections.push(`**State:** ${bpf.state === 'Active' ? MarkdownFormatter.formatBadge('Active', 'success') : MarkdownFormatter.formatBadge('Draft', 'warning')}`);
      sections.push(`**Entities:** ${bpf.definition.entities.join(', ')}`);
      sections.push(`**Cross-Entity:** ${bpf.definition.crossEntityFlow ? 'Yes' : 'No'}`);
      sections.push('');

      // Stages
      sections.push(MarkdownFormatter.formatHeading('Stages', 3));
      sections.push('');

      for (const stage of bpf.definition.stages) {
        sections.push(`**${stage.order}. ${stage.name}** (${stage.entity})`);
        sections.push('');

        if (stage.steps.length > 0) {
          const stepsList = stage.steps.map(step =>
            `${step.name} (${step.fieldName})${step.required ? ' *Required*' : ''}`
          );
          sections.push(MarkdownFormatter.formatList(stepsList));
        }
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  /**
   * Generate analysis/complexity-scores.md
   */
  private generateComplexityScores(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Entity Complexity Scores', 1));
    sections.push('');

    // Calculate complexity for each entity
    const scores = result.entities.map(entity => {
      const score = this.calculateComplexityScore(entity, result);
      return {
        entity: entity.entity.LogicalName,
        displayName: entity.entity.DisplayName?.UserLocalizedLabel?.Label || entity.entity.LogicalName,
        score: score.total,
        complexity: score.level,
        breakdown: score.breakdown,
      };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Table
    const headers = ['Entity', 'Score', 'Complexity', 'Fields', 'Plugins', 'Flows', 'Rules'];
    const rows = scores.map(s => [
      s.displayName,
      s.score.toString(),
      this.formatComplexityBadge(s.complexity),
      s.breakdown.attributes.toString(),
      s.breakdown.plugins.toString(),
      s.breakdown.flows.toString(),
      s.breakdown.businessRules.toString(),
    ]);

    sections.push(MarkdownFormatter.formatTable(headers, rows));
    sections.push('');

    // Methodology
    sections.push(MarkdownFormatter.formatHeading('Scoring Methodology', 2));
    sections.push('');
    sections.push('Complexity score is calculated based on:');
    sections.push('');
    sections.push(MarkdownFormatter.formatList([
      'Attributes: 1 point each',
      'Plugins: 5 points each',
      'Flows: 3 points each',
      'Business Rules: 2 points each',
      'Forms: 2 points each',
    ]));
    sections.push('');
    sections.push('**Complexity Levels:**');
    sections.push('- Low: 0-50 points');
    sections.push('- Medium: 51-150 points');
    sections.push('- High: 151+ points');
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate analysis/performance-risks.md
   */
  private generatePerformanceRisks(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Performance Risks', 1));
    sections.push('');

    // Collect all risks
    const allRisks: Array<PerformanceRisk & { entity: string }> = [];
    for (const entity of result.entities) {
      if (entity.performanceRisks) {
        for (const risk of entity.performanceRisks) {
          allRisks.push({
            ...risk,
            entity: entity.entity.LogicalName,
          });
        }
      }
    }

    if (allRisks.length === 0) {
      sections.push('No performance risks detected.');
      return sections.join('\n');
    }

    // Group by severity
    const bySeverity = new Map<string, typeof allRisks>();
    for (const risk of allRisks) {
      if (!bySeverity.has(risk.severity)) {
        bySeverity.set(risk.severity, []);
      }
      bySeverity.get(risk.severity)!.push(risk);
    }

    // Display each severity level
    for (const severity of ['Critical', 'High', 'Medium', 'Low']) {
      const risks = bySeverity.get(severity) || [];
      if (risks.length === 0) continue;

      sections.push(MarkdownFormatter.formatHeading(`${severity} Risk (${risks.length})`, 2));
      sections.push('');

      const headers = ['Entity', 'Step', 'Type', 'Reason', 'Recommendation'];
      const rows = risks.map(risk => [
        risk.entity,
        risk.step.name,
        risk.step.type,
        risk.reason,
        risk.recommendation,
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate analysis/migration-recommendations.md
   */
  private generateMigrationRecommendations(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Migration Recommendations', 1));
    sections.push('');

    if (result.classicWorkflows.length === 0) {
      sections.push('No classic workflows found. No migration needed.');
      return sections.join('\n');
    }

    sections.push('⚠️ **Classic workflows are deprecated and will be retired by Microsoft.**');
    sections.push('');
    sections.push(`**Total Classic Workflows:** ${result.classicWorkflows.length}`);
    sections.push('');

    // Group by complexity
    const byComplexity = new Map<string, ClassicWorkflow[]>();
    for (const workflow of result.classicWorkflows) {
      const complexity = workflow.migrationRecommendation?.complexity || 'Unknown';
      if (!byComplexity.has(complexity)) {
        byComplexity.set(complexity, []);
      }
      byComplexity.get(complexity)!.push(workflow);
    }

    // Display each complexity level
    for (const complexity of ['Critical', 'High', 'Medium', 'Low']) {
      const workflows = byComplexity.get(complexity) || [];
      if (workflows.length === 0) continue;

      sections.push(MarkdownFormatter.formatHeading(`${complexity} Complexity (${workflows.length})`, 2));
      sections.push('');

      const headers = ['Workflow', 'Entity', 'Type', 'Effort', 'Approach'];
      const rows = workflows.map(wf => [
        wf.name,
        wf.entityDisplayName || wf.entity,
        wf.typeName,
        wf.migrationRecommendation?.effort || 'Unknown',
        wf.migrationRecommendation?.approach.substring(0, 50) + '...' || 'Unknown',
      ]);

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');
    }

    // General guidance
    sections.push(MarkdownFormatter.formatHeading('General Migration Guidance', 2));
    sections.push('');
    sections.push(MarkdownFormatter.formatList([
      'Prioritize critical and high complexity workflows first',
      'Test thoroughly in a development environment before production',
      'Update security roles and permissions for Power Automate',
      'Consider using connection references for external integrations',
      'Document any custom logic that may need reimplementation',
      'Plan for user training on new flow behavior',
    ]));
    sections.push('');

    sections.push('**Resources:**');
    sections.push('- ' + MarkdownFormatter.formatLink('Microsoft Migration Guide', 'https://learn.microsoft.com/power-automate/migrate-from-classic-workflows'));
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Build file tree structure from file paths
   */
  private buildFileTree(files: Map<string, string>): FileNode {
    const root: FileNode = {
      name: 'blueprint',
      type: 'directory',
      path: 'blueprint',
      children: [],
    };

    for (const filePath of files.keys()) {
      this.addFileToTree(root, filePath, files.get(filePath)!);
    }

    return root;
  }

  /**
   * Add a file to the tree structure
   */
  private addFileToTree(root: FileNode, path: string, content: string): void {
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children) {
        current.children = [];
      }

      let existing = current.children.find(c => c.name === part);

      if (!existing) {
        existing = {
          name: part,
          type: isLast ? 'file' : 'directory',
          path: `blueprint/${parts.slice(0, i + 1).join('/')}`,
          children: isLast ? undefined : [],
        };

        if (isLast) {
          existing.size = new TextEncoder().encode(content).length;
        }

        current.children.push(existing);
      }

      current = existing;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Check if entity has any automation
   */
  private hasAutomation(entity: EntityBlueprint, result: BlueprintResult): boolean {
    // Check for plugins
    if (entity.plugins.length > 0) return true;

    // Check for flows
    if (entity.flows.length > 0) return true;

    // Check for business rules
    if (entity.businessRules.length > 0) return true;

    // Check for JavaScript event handlers
    const jsHandlers = entity.forms.flatMap(form => form.eventHandlers);
    if (jsHandlers.length > 0) return true;

    // Check for classic workflows
    const classicWorkflows = result.classicWorkflowsByEntity.get(entity.entity.LogicalName) || [];
    if (classicWorkflows.length > 0) return true;

    return false;
  }

  /**
   * Check if entity has execution pipeline components
   * (server-side automation that participates in the execution pipeline)
   */
  private hasExecutionPipeline(entity: EntityBlueprint, result: BlueprintResult): boolean {
    // Plugins are always part of execution pipeline
    if (entity.plugins.length > 0) return true;

    // Entity-scoped business rules run server-side (part of execution pipeline)
    const hasEntityScopedBRs = entity.businessRules.some(br => br.scopeName === 'Entity');
    if (hasEntityScopedBRs) return true;

    // Check for synchronous classic workflows
    const classicWorkflows = result.classicWorkflowsByEntity.get(entity.entity.LogicalName) || [];
    const hasSyncWorkflows = classicWorkflows.some(wf => wf.mode === 0); // 0 = Synchronous
    if (hasSyncWorkflows) return true;

    // Flows with Dataverse triggers are part of execution pipeline
    const hasDataverseFlows = entity.flows.some(flow =>
      flow.definition.triggerType === 'Dataverse'
    );
    if (hasDataverseFlows) return true;

    return false;
  }

  /**
   * Get BPFs for a specific entity
   */
  private getEntityBpfs(entityLogicalName: string, result: BlueprintResult): BusinessProcessFlow[] {
    const bpfs = result.businessProcessFlowsByEntity.get(entityLogicalName) || [];
    return bpfs;
  }

  /**
   * Format complexity badge
   */
  private formatComplexityBadge(complexity: 'Low' | 'Medium' | 'High'): string {
    const badges = {
      Low: MarkdownFormatter.formatBadge('Low', 'success'),
      Medium: MarkdownFormatter.formatBadge('Medium', 'warning'),
      High: MarkdownFormatter.formatBadge('High', 'error'),
    };
    return badges[complexity];
  }

  /**
   * Format flow state badge
   */
  private formatFlowStateBadge(state: 'Draft' | 'Active' | 'Suspended'): string {
    const badges = {
      Active: MarkdownFormatter.formatBadge('Active', 'success'),
      Draft: MarkdownFormatter.formatBadge('Draft', 'warning'),
      Suspended: MarkdownFormatter.formatBadge('Suspended', 'error'),
    };
    return badges[state];
  }

  /**
   * Format date to readable string
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format file size to readable string
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format workflow triggers
   */
  private formatWorkflowTriggers(workflow: ClassicWorkflow): string {
    const triggers: string[] = [];
    if (workflow.triggerOnCreate) triggers.push('Create');
    if (workflow.triggerOnUpdate) triggers.push('Update');
    if (workflow.triggerOnDelete) triggers.push('Delete');
    if (workflow.onDemand) triggers.push('Manual');
    return triggers.join(', ') || 'None';
  }

  /**
   * Check if plugin has external calls (placeholder)
   */
  private hasExternalCalls(_plugin: PluginStep): boolean {
    // This would need to be detected during plugin discovery
    // For now, return false as placeholder
    return false;
  }

  /**
   * Get solution for plugin (placeholder)
   */
  private getPluginSolution(_plugin: PluginStep, _result: BlueprintResult): string {
    // This would need solution component mapping
    return 'Unknown';
  }

  /**
   * Group plugins by assembly -> entity
   */
  private groupPluginsByAssembly(plugins: PluginStep[]): Map<string, Map<string, PluginStep[]>> {
    const grouped = new Map<string, Map<string, PluginStep[]>>();

    for (const plugin of plugins) {
      if (!grouped.has(plugin.assemblyName)) {
        grouped.set(plugin.assemblyName, new Map());
      }

      const entities = grouped.get(plugin.assemblyName)!;
      if (!entities.has(plugin.entity)) {
        entities.set(plugin.entity, []);
      }

      entities.get(plugin.entity)!.push(plugin);
    }

    return grouped;
  }

  /**
   * Group flows by entity
   */
  private groupFlowsByEntity(flows: Flow[]): Map<string, Flow[]> {
    const grouped = new Map<string, Flow[]>();

    for (const flow of flows) {
      const entity = flow.entity || 'Manual/Scheduled';
      if (!grouped.has(entity)) {
        grouped.set(entity, []);
      }
      grouped.get(entity)!.push(flow);
    }

    return grouped;
  }

  /**
   * Group business rules by entity
   */
  private groupBusinessRulesByEntity(rules: BusinessRule[]): Map<string, BusinessRule[]> {
    const grouped = new Map<string, BusinessRule[]>();

    for (const rule of rules) {
      if (!grouped.has(rule.entity)) {
        grouped.set(rule.entity, []);
      }
      grouped.get(rule.entity)!.push(rule);
    }

    return grouped;
  }

  /**
   * Group classic workflows by entity
   */
  private groupClassicWorkflowsByEntity(workflows: ClassicWorkflow[]): Map<string, ClassicWorkflow[]> {
    const grouped = new Map<string, ClassicWorkflow[]>();

    for (const workflow of workflows) {
      if (!grouped.has(workflow.entity)) {
        grouped.set(workflow.entity, []);
      }
      grouped.get(workflow.entity)!.push(workflow);
    }

    return grouped;
  }

  /**
   * Group web resources by type
   */
  private groupWebResourcesByType(resources: WebResource[]): Map<string, WebResource[]> {
    const grouped = new Map<string, WebResource[]>();

    for (const resource of resources) {
      if (!grouped.has(resource.typeName)) {
        grouped.set(resource.typeName, []);
      }
      grouped.get(resource.typeName)!.push(resource);
    }

    return grouped;
  }

  /**
   * Group custom APIs by binding type
   */
  private groupCustomAPIsByBinding(apis: CustomAPI[]): Map<string, CustomAPI[]> {
    const grouped = new Map<string, CustomAPI[]>();

    for (const api of apis) {
      if (!grouped.has(api.bindingType)) {
        grouped.set(api.bindingType, []);
      }
      grouped.get(api.bindingType)!.push(api);
    }

    return grouped;
  }

  /**
   * Group BPFs by primary entity
   */
  private groupBpfsByEntity(bpfs: BusinessProcessFlow[]): Map<string, BusinessProcessFlow[]> {
    const grouped = new Map<string, BusinessProcessFlow[]>();

    for (const bpf of bpfs) {
      const entity = bpf.primaryEntityDisplayName || bpf.primaryEntity;
      if (!grouped.has(entity)) {
        grouped.set(entity, []);
      }
      grouped.get(entity)!.push(bpf);
    }

    return grouped;
  }

  /**
   * Calculate complexity score for entity
   */
  private calculateComplexityScore(entity: EntityBlueprint, _result: BlueprintResult): {
    total: number;
    level: 'Low' | 'Medium' | 'High';
    breakdown: {
      attributes: number;
      plugins: number;
      flows: number;
      businessRules: number;
      forms: number;
    };
  } {
    const breakdown = {
      attributes: entity.entity.Attributes?.length || 0,
      plugins: entity.plugins.length,
      flows: entity.flows.length,
      businessRules: entity.businessRules.length,
      forms: entity.forms.length,
    };

    const total =
      breakdown.attributes * 1 +
      breakdown.plugins * 5 +
      breakdown.flows * 3 +
      breakdown.businessRules * 2 +
      breakdown.forms * 2;

    let level: 'Low' | 'Medium' | 'High';
    if (total <= 50) {
      level = 'Low';
    } else if (total <= 150) {
      level = 'Medium';
    } else {
      level = 'High';
    }

    return { total, level, breakdown };
  }

  /**
   * Generate security overview with special permissions matrix
   */
  private generateSecurityOverview(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Security Overview', 1));
    sections.push('');
    sections.push('This document provides an overview of security roles and field security profiles in the solution.');
    sections.push('');

    // Security Roles Section
    if (result.securityRoles && result.securityRoles.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Security Roles', 2));
      sections.push('');
      sections.push(`Found **${result.securityRoles.length}** security role(s) in the selected solution(s).`);
      sections.push('');

      // Special Permissions Matrix
      sections.push(MarkdownFormatter.formatHeading('Special Permissions Matrix', 3));
      sections.push('');
      sections.push('This table shows which security roles have special/miscellaneous permissions.');
      sections.push('');

      // Build special permissions table (all 11 core special permissions)
      const specialPermissionKeys: Array<keyof import('../discovery/SecurityRoleDiscovery.js').SpecialPermissions> = [
        'documentGeneration',
        'dynamics365ForMobile',
        'exportToExcel',
        'goOfflineInOutlook',
        'mailMerge',
        'print',
        'syncToOutlook',
        'useDynamics365AppForOutlook',
        'activateRealtimeProcesses',
        'executeWorkflowJob',
        'runFlows',
      ];

      const headers = ['Role Name', 'Business Unit', ...specialPermissionKeys.map(k => this.formatSpecialPermissionName(k))];
      const rows: string[][] = [];

      for (const role of result.securityRoles) {
        const row = [
          `[${role.name}](roles/${role.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md)`,
          role.businessunitname || 'Unknown',
        ];

        for (const key of specialPermissionKeys) {
          row.push(role.specialPermissions[key] ? '✓' : '');
        }

        rows.push(row);
      }

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');

      // Role Summary Table
      sections.push(MarkdownFormatter.formatHeading('Role Summary', 3));
      sections.push('');

      const summaryHeaders = ['Role Name', 'Business Unit', 'Entities', 'System Admin', 'Managed'];
      const summaryRows: string[][] = [];

      for (const role of result.securityRoles) {
        summaryRows.push([
          `[${role.name}](roles/${role.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md)`,
          role.businessunitname || 'Unknown',
          role.totalEntities.toString(),
          role.hasSystemAdminPrivileges ? 'Yes' : 'No',
          role.ismanaged ? 'Yes' : 'No',
        ]);
      }

      sections.push(MarkdownFormatter.formatTable(summaryHeaders, summaryRows));
      sections.push('');
    }

    // Field Security Profiles Section
    if (result.fieldSecurityProfiles && result.fieldSecurityProfiles.length > 0) {
      sections.push(MarkdownFormatter.formatHeading('Field Security Profiles', 2));
      sections.push('');
      sections.push(`Found **${result.fieldSecurityProfiles.length}** field security profile(s) in the selected solution(s).`);
      sections.push('');
      sections.push('[View Field Security Profiles Details](field-security-profiles.md)');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate detailed security role page
   */
  private generateSecurityRoleDetail(role: import('../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading(`Security Role: ${role.name}`, 1));
    sections.push('');

    // Role metadata
    sections.push(MarkdownFormatter.formatHeading('Details', 2));
    sections.push('');
    sections.push(`- **Business Unit:** ${role.businessunitname || 'Unknown'}`);
    sections.push(`- **Is Managed:** ${role.ismanaged ? 'Yes' : 'No'}`);
    sections.push(`- **Is Customizable:** ${role.iscustomizable ? 'Yes' : 'No'}`);
    sections.push(`- **Has System Admin Privileges:** ${role.hasSystemAdminPrivileges ? 'Yes' : 'No'}`);
    sections.push(`- **Total Entities with Permissions:** ${role.totalEntities}`);
    if (role.description) {
      sections.push(`- **Description:** ${role.description}`);
    }
    sections.push('');

    // Special Permissions
    sections.push(MarkdownFormatter.formatHeading('Special Permissions', 2));
    sections.push('');
    const activeSpecialPermissions = Object.entries(role.specialPermissions)
      .filter(([_, value]) => value)
      .map(([key]) => this.formatSpecialPermissionName(key as keyof import('../discovery/SecurityRoleDiscovery.js').SpecialPermissions));

    if (activeSpecialPermissions.length > 0) {
      for (const perm of activeSpecialPermissions) {
        sections.push(`- ✓ ${perm}`);
      }
    } else {
      sections.push('*No special permissions granted*');
    }
    sections.push('');

    // Entity Permissions
    sections.push(MarkdownFormatter.formatHeading('Entity Permissions', 2));
    sections.push('');

    if (role.entityPermissions.length > 0) {
      sections.push(`This role has permissions on **${role.entityPermissions.length}** entit${role.entityPermissions.length === 1 ? 'y' : 'ies'}.`);
      sections.push('');

      const headers = ['Entity', ...['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share']];
      const rows: string[][] = [];

      for (const entityPerm of role.entityPermissions) {
        // Skip entities with no privileges
        if (entityPerm.privileges.length === 0) {
          continue;
        }

        const row = [entityPerm.entityLogicalName];
        const privMap = new Map(entityPerm.privileges.map(p => [p.type, p]));

        for (const type of ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share']) {
          const priv = privMap.get(type as any);
          row.push(priv ? priv.depth : '');
        }

        rows.push(row);
      }

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');

      // Legend
      sections.push('**Privilege Depth Legend:**');
      sections.push('- **Basic** - User level (own records only)');
      sections.push('- **Local** - Business unit level');
      sections.push('- **Deep** - Parent and child business units');
      sections.push('- **Global** - Organization level (all records)');
      sections.push('');
    } else {
      sections.push('*No entity permissions defined*');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate field security profiles page
   */
  private generateFieldSecurityProfiles(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Field Security Profiles', 1));
    sections.push('');
    sections.push('Field security profiles control who can read, create, or update specific secured fields.');
    sections.push('');

    if (result.fieldSecurityProfiles && result.fieldSecurityProfiles.length > 0) {
      const headers = ['Profile Name', 'Description'];
      const rows: string[][] = [];

      for (const profile of result.fieldSecurityProfiles) {
        rows.push([
          profile.name,
          profile.description || '*No description*',
        ]);
      }

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');

      sections.push('> **Note:** Field-level permissions for specific entities are documented in each entity\'s schema page.');
      sections.push('');
    } else {
      sections.push('*No field security profiles found*');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate attribute masking rules page
   */
  private generateAttributeMaskingRules(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Attribute Masking Rules', 1));
    sections.push('');
    sections.push('Attribute masking rules control how sensitive data is masked when displayed to users without appropriate permissions.');
    sections.push('');

    if (result.attributeMaskingRules && result.attributeMaskingRules.length > 0) {
      const headers = ['Entity', 'Attribute', 'Masking Type', 'Managed'];
      const rows: string[][] = [];

      for (const rule of result.attributeMaskingRules) {
        const maskingType = rule.maskingtype === 1 ? 'Full' : rule.maskingtype === 2 ? 'Partial' : rule.maskingtype === 3 ? 'Email' : 'Custom';
        rows.push([
          rule.entitylogicalname,
          rule.attributelogicalname,
          maskingType,
          rule.ismanaged ? 'Yes' : 'No',
        ]);
      }

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');

      sections.push('**Masking Types:**');
      sections.push('- **Full**: Entire value is masked');
      sections.push('- **Partial**: Part of the value is shown');
      sections.push('- **Email**: Email format is preserved while masking');
      sections.push('- **Custom**: Custom masking format is applied');
      sections.push('');
    } else {
      sections.push('*No attribute masking rules found*');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Generate column security profiles page
   */
  private generateColumnSecurityProfiles(result: BlueprintResult): string {
    const sections: string[] = [];

    sections.push(MarkdownFormatter.formatHeading('Column Security Profiles', 1));
    sections.push('');
    sections.push('Column security profiles define which users can access specific secured columns across entities.');
    sections.push('');

    if (result.columnSecurityProfiles && result.columnSecurityProfiles.length > 0) {
      const headers = ['Profile Name', 'Description', 'Managed'];
      const rows: string[][] = [];

      for (const profile of result.columnSecurityProfiles) {
        rows.push([
          profile.name,
          profile.description || '*No description*',
          profile.ismanaged ? 'Yes' : 'No',
        ]);
      }

      sections.push(MarkdownFormatter.formatTable(headers, rows));
      sections.push('');

      sections.push('> **Note:** Column-level permissions control create, read, and update access to secured fields.');
      sections.push('');
    } else {
      sections.push('*No column security profiles found*');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Format special permission name for display
   */
  private formatSpecialPermissionName(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
