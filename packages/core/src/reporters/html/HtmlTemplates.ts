/**
 * HTML Templates for Blueprint Report
 * Generates each section of the HTML report with embedded CSS and JavaScript
 */
import type {
  BlueprintResult,
  BlueprintMetadata,
  BlueprintSummary,
  ERDDefinition,
  EntityBlueprint,
  PluginStep,
  Flow,
  BusinessRule,
  WebResource,
  CrossEntityLink,
  ExternalEndpoint,
} from '../../types/blueprint.js';
import type { ClassicWorkflow } from '../../types/classicWorkflow.js';
import type { CustomAPI } from '../../types/customApi.js';
import type { EnvironmentVariable } from '../../types/environmentVariable.js';
import type { ConnectionReference } from '../../types/connectionReference.js';
import type { BusinessProcessFlow } from '../../types/businessProcessFlow.js';

/**
 * Main HTML Templates class
 */
export class HtmlTemplates {
  /**
   * Generate complete HTML head section
   */
  htmlHead(result: BlueprintResult): string {
    const title = `Blueprint - ${result.metadata.environment || 'Power Platform'}`;
    return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Power Platform Solution Blueprint (PPSB)">
  <meta name="description" content="Complete architectural blueprint for Power Platform solutions">
  <title>${this.escapeHtml(title)}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
${this.embeddedCSS()}
  </style>
</head>`;
  }

  /**
   * Generate sidebar navigation
   */
  htmlNavigation(): string {
    return `<nav class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
  <div class="sidebar-header">
    <h3>Blueprint</h3>
    <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">☰</button>
  </div>
  <ul class="nav-links">
    <li><a href="#summary">📊 Summary</a></li>
    <li><a href="#erd">🔗 Entity Relationship Diagram</a></li>
    <li><a href="#entities">📦 Entities</a></li>
    <li><a href="#plugins">🔌 Plugins</a></li>
    <li><a href="#flows">⚡ Flows</a></li>
    <li><a href="#business-rules">📋 Business Rules</a></li>
    <li><a href="#classic-workflows">⏱️ Classic Workflows</a></li>
    <li><a href="#business-process-flows">🔄 Business Process Flows</a></li>
    <li><a href="#web-resources">🌐 Web Resources</a></li>
    <li><a href="#custom-apis">🔧 Custom APIs</a></li>
    <li><a href="#environment-variables">⚙️ Environment Variables</a></li>
    <li><a href="#connection-references">🔗 Connection References</a></li>
    <li><a href="#security">🔒 Security</a></li>
    <li><a href="#external-dependencies">🌍 External Dependencies</a></li>
    <li><a href="#cross-entity">🔀 Cross-Entity Automation</a></li>
  </ul>
  <div class="nav-footer">
    <button class="btn-print" onclick="window.print()" aria-label="Print blueprint">🖨️ Print</button>
  </div>
</nav>`;
  }

  /**
   * Generate header section
   */
  htmlHeader(metadata: BlueprintMetadata): string {
    const generatedDate = metadata.generatedAt.toLocaleString();
    return `<header class="report-header" role="banner">
  <h1>Power Platform Solution Blueprint</h1>
  <div class="metadata-grid">
    <div class="metadata-item">
      <span class="metadata-label">Environment:</span>
      <span class="metadata-value">${this.escapeHtml(metadata.environment)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Generated:</span>
      <span class="metadata-value">${this.escapeHtml(generatedDate)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Scope:</span>
      <span class="metadata-value">${this.escapeHtml(metadata.scope.description)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Entities:</span>
      <span class="metadata-value">${metadata.entityCount}</span>
    </div>
  </div>
</header>`;
  }

  /**
   * Generate ERD section
   * Note: Only includes the first diagram (comprehensive view) to match the tool UI behavior
   */
  htmlErdSection(erd: ERDDefinition | undefined): string {
    if (!erd || erd.diagrams.length === 0) {
      return `<section id="erd" class="content-section">
  <h2>Entity Relationship Diagram</h2>
  <div class="empty-state">No ERD available</div>
</section>`;
    }

    const legendHtml = this.generateLegendHtml(erd.legend);

    // Use only the first diagram (comprehensive view with all entities) - matches UI behavior
    const diagram = erd.diagrams[0];
    const diagramHtml = `<div class="erd-diagram">
  <h3>${this.escapeHtml(diagram.title)}</h3>
  <p class="diagram-description">${this.escapeHtml(diagram.description)}</p>
  <div class="mermaid" id="diagram-0">
${diagram.mermaidDiagram}
  </div>
  <p class="diagram-stats">Entities: ${diagram.entityCount} | Relationships: ${diagram.relationshipCount}</p>
</div>`;

    return `<section id="erd" class="content-section">
  <h2>Entity Relationship Diagram</h2>
  ${legendHtml}
  ${diagramHtml}
</section>`;
  }

  /**
   * Generate legend HTML for ERD
   */
  private generateLegendHtml(legend: any[]): string {
    if (!legend || legend.length === 0) return '';

    const items = legend.map(item => {
      return `<div class="legend-item">
  <span class="legend-color" style="background-color: ${item.color}"></span>
  <span class="legend-label">${this.escapeHtml(item.publisherName)} (${item.entityCount})</span>
</div>`;
    }).join('\n');

    return `<div class="erd-legend">
  <h4>Publishers</h4>
  <div class="legend-items">
${items}
  </div>
</div>`;
  }

  /**
   * Generate summary section
   */
  htmlSummary(summary: BlueprintSummary): string {
    return `<section id="summary" class="content-section">
  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="card-number">${summary.totalEntities}</div>
      <div class="card-label">Entities</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalAttributes}</div>
      <div class="card-label">Attributes</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalPlugins}</div>
      <div class="card-label">Plugins</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalFlows}</div>
      <div class="card-label">Flows</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalBusinessRules}</div>
      <div class="card-label">Business Rules</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalWebResources}</div>
      <div class="card-label">Web Resources</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalCustomAPIs}</div>
      <div class="card-label">Custom APIs</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalSecurityRoles}</div>
      <div class="card-label">Security Roles</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalFieldSecurityProfiles}</div>
      <div class="card-label">Field Security Profiles</div>
    </div>
    <div class="summary-card ${summary.totalClassicWorkflows > 0 ? 'card-warning' : ''}">
      <div class="card-number">${summary.totalClassicWorkflows}</div>
      <div class="card-label">Classic Workflows</div>
    </div>
  </div>
</section>`;
  }

  /**
   * Generate entities accordion section
   */
  htmlEntitiesAccordion(entities: EntityBlueprint[]): string {
    if (entities.length === 0) {
      return `<section id="entities" class="content-section">
  <h2>Entities</h2>
  <div class="empty-state">No entities found</div>
</section>`;
    }

    const accordionItems = entities.map((entityBp, index) => {
      const entity = entityBp.entity;
      const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName;
      const attributeCount = entity.Attributes?.length || 0;
      const pluginCount = entityBp.plugins?.length || 0;
      const flowCount = entityBp.flows?.length || 0;
      const brCount = entityBp.businessRules?.length || 0;

      // Check if entity has server-side automation for execution pipeline
      const hasExecutionPipeline = this.hasEntityExecutionPipeline(entityBp);

      return `<div class="accordion-item">
  <div class="accordion-header" onclick="toggleAccordion('entity-${index}')">
    <span class="accordion-icon" id="icon-entity-${index}">+</span>
    <h3>${this.escapeHtml(displayName)}</h3>
    <span class="entity-badges">
      ${attributeCount > 0 ? `<span class="badge badge-info">${attributeCount} fields</span>` : ''}
      ${pluginCount > 0 ? `<span class="badge badge-success">${pluginCount} plugins</span>` : ''}
      ${flowCount > 0 ? `<span class="badge badge-primary">${flowCount} flows</span>` : ''}
      ${brCount > 0 ? `<span class="badge badge-warning">${brCount} rules</span>` : ''}
    </span>
  </div>
  <div class="accordion-content" id="entity-${index}" style="display: none;">
    <!-- Entity Tabs -->
    <div class="entity-tabs">
      <div class="tabs-header">
        <button class="tab-button active" onclick="switchEntityTab('entity-${index}', 'overview')">Overview</button>
        <button class="tab-button" onclick="switchEntityTab('entity-${index}', 'schema')">Schema</button>
        ${this.hasEntityAutomation(entityBp) ? `<button class="tab-button" onclick="switchEntityTab('entity-${index}', 'automation')">Automation</button>` : ''}
        ${hasExecutionPipeline ? `<button class="tab-button" onclick="switchEntityTab('entity-${index}', 'pipeline')">Execution Pipeline</button>` : ''}
      </div>

      <!-- Overview Tab -->
      <div class="tab-content active" id="entity-${index}-overview">
        ${this.generateEntityOverviewTab(entityBp)}
      </div>

      <!-- Schema Tab -->
      <div class="tab-content" id="entity-${index}-schema">
        ${this.generateEntitySchemaTab(entityBp)}
      </div>

      ${this.hasEntityAutomation(entityBp) ? `<!-- Automation Tab -->
      <div class="tab-content" id="entity-${index}-automation">
        ${this.generateEntityAutomationTab(entityBp)}
      </div>` : ''}

      ${hasExecutionPipeline ? `<!-- Execution Pipeline Tab -->
      <div class="tab-content" id="entity-${index}-pipeline">
        ${this.generateEntityPipelineTab(entityBp)}
      </div>` : ''}
    </div>
  </div>
</div>`;
    }).join('\n');

    return `<section id="entities" class="content-section">
  <h2>Entities (${entities.length})</h2>
  <div class="accordion">
${accordionItems}
  </div>
</section>`;
  }

  /**
   * Generate attributes table for entity detail
   */
  private generateAttributesTable(attributes: any[]): string {
    if (attributes.length === 0) return '';

    const rows = attributes.slice(0, 50).map(attr => {
      const displayName = attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName;
      const description = attr.Description?.UserLocalizedLabel?.Label || '';
      const required = attr.RequiredLevel?.Value || 'None';
      const type = attr.AttributeType || 'Unknown';

      return `<tr>
  <td>${this.escapeHtml(attr.LogicalName)}</td>
  <td>${this.escapeHtml(displayName)}</td>
  <td>${this.escapeHtml(type)}</td>
  <td><span class="badge badge-${required === 'SystemRequired' ? 'error' : required === 'ApplicationRequired' ? 'warning' : 'info'}">${required}</span></td>
  <td style="word-break: break-word;">${this.escapeHtml(description)}</td>
</tr>`;
    }).join('\n');

    const moreText = attributes.length > 50 ? `<p class="table-note">Showing 50 of ${attributes.length} attributes</p>` : '';

    return `<div class="entity-subsection">
  <h4>Attributes (${attributes.length})</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th>Logical Name</th>
        <th>Display Name</th>
        <th>Type</th>
        <th>Required</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  ${moreText}
</div>`;
  }

  /**
   * Generate plugins table for entity detail
   */
  private generateEntityPluginsTable(plugins: PluginStep[]): string {
    if (plugins.length === 0) return '';

    const rows = plugins.map(plugin => {
      return `<tr>
  <td>${this.escapeHtml(plugin.name)}</td>
  <td>${this.escapeHtml(plugin.message || '')}</td>
  <td>${this.escapeHtml(plugin.stageName || '')}</td>
  <td>${this.escapeHtml(plugin.modeName || '')}</td>
  <td style="word-break: break-word;">${this.escapeHtml(plugin.description || '')}</td>
</tr>`;
    }).join('\n');

    return `<div class="entity-subsection">
  <h4>Plugins (${plugins.length})</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Message</th>
        <th>Stage</th>
        <th>Mode</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>`;
  }

  /**
   * Generate flows table for entity detail
   */
  private generateEntityFlowsTable(flows: Flow[]): string {
    if (flows.length === 0) return '';

    const rows = flows.map(flow => {
      return `<tr>
  <td>${this.escapeHtml(flow.name)}</td>
  <td><span class="badge badge-${flow.state === 'Active' ? 'success' : flow.state === 'Draft' ? 'warning' : 'error'}">${flow.state}</span></td>
  <td>${this.escapeHtml(flow.definition.triggerEvent)}</td>
  <td style="word-break: break-word;">${this.escapeHtml(flow.description || '')}</td>
</tr>`;
    }).join('\n');

    return `<div class="entity-subsection">
  <h4>Flows (${flows.length})</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>State</th>
        <th>Trigger</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</div>`;
  }

  /**
   * Check if entity has any automation
   */
  private hasEntityAutomation(entityBp: EntityBlueprint): boolean {
    return entityBp.plugins.length > 0 ||
           entityBp.flows.length > 0 ||
           entityBp.businessRules.length > 0;
  }

  /**
   * Check if entity has server-side execution pipeline
   */
  private hasEntityExecutionPipeline(entityBp: EntityBlueprint): boolean {
    // Has plugins
    if (entityBp.plugins.length > 0) return true;

    // Has entity-scoped business rules (they run server-side)
    const hasEntityScopedBRs = entityBp.businessRules.some(br => br.scopeName === 'Entity');
    if (hasEntityScopedBRs) return true;

    // Has Dataverse flows (they run server-side)
    const hasDataverseFlows = entityBp.flows.some(flow => flow.definition.triggerType === 'Dataverse');
    if (hasDataverseFlows) return true;

    return false;
  }

  /**
   * Generate Overview tab content for entity
   */
  private generateEntityOverviewTab(entityBp: EntityBlueprint): string {
    const entity = entityBp.entity;
    const description = entity.Description?.UserLocalizedLabel?.Label || '';

    const metadata = [
      ['Logical Name', entity.LogicalName],
      ['Schema Name', entity.SchemaName],
      ['Primary Field', entity.PrimaryNameAttribute || 'N/A'],
      ['Ownership', entity.OwnershipTypeName || 'N/A'],
      ['Is Activity', entity.IsActivity ? 'Yes' : 'No'],
      ['Is Custom', entity.IsCustomEntity ? 'Yes' : 'No'],
    ];

    const automationSummary = `
      <div class="automation-summary">
        <div class="summary-row">
          <span class="summary-label">Plugins:</span>
          <span class="summary-value">${entityBp.plugins.length}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Cloud Flows:</span>
          <span class="summary-value">${entityBp.flows.length}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Business Rules:</span>
          <span class="summary-value">${entityBp.businessRules.length}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Attributes:</span>
          <span class="summary-value">${entity.Attributes?.length || 0}</span>
        </div>
      </div>
    `;

    return `
      ${description ? `<div class="entity-description">${this.escapeHtml(description)}</div>` : ''}
      <div class="entity-metadata">
        <h4>Entity Information</h4>
        <table class="metadata-table">
          ${metadata.map(([key, value]) => `<tr><th>${key}</th><td>${this.escapeHtml(value)}</td></tr>`).join('\n')}
        </table>
      </div>
      ${automationSummary}
    `;
  }

  /**
   * Generate Schema tab content for entity
   */
  private generateEntitySchemaTab(entityBp: EntityBlueprint): string {
    const entity = entityBp.entity;
    const attributes = entity.Attributes || [];
    const oneToMany = entity.OneToManyRelationships || [];
    const manyToOne = entity.ManyToOneRelationships || [];
    const manyToMany = entity.ManyToManyRelationships || [];

    let content = '';

    // Attributes section
    if (attributes.length > 0) {
      content += this.generateAttributesTable(attributes);
    } else {
      content += '<div class="empty-state">No attributes found</div>';
    }

    // Relationships section
    const totalRelationships = oneToMany.length + manyToOne.length + manyToMany.length;
    if (totalRelationships > 0) {
      content += `<div class="entity-subsection">
        <h4>Relationships (${totalRelationships})</h4>
        ${oneToMany.length > 0 ? this.generateRelationshipsSection('One-to-Many', oneToMany) : ''}
        ${manyToOne.length > 0 ? this.generateRelationshipsSection('Many-to-One', manyToOne) : ''}
        ${manyToMany.length > 0 ? this.generateRelationshipsSection('Many-to-Many', manyToMany) : ''}
      </div>`;
    }

    // Field Security section
    if (entityBp.fieldSecurity && entityBp.fieldSecurity.securedFields.length > 0) {
      content += this.generateFieldSecuritySection(entityBp.fieldSecurity);
    }

    return content;
  }

  /**
   * Generate Automation tab content for entity
   */
  private generateEntityAutomationTab(entityBp: EntityBlueprint): string {
    let content = '';

    const hasAutomation = entityBp.plugins.length > 0 || entityBp.flows.length > 0 || entityBp.businessRules.length > 0;

    if (!hasAutomation) {
      return '<div class="empty-state">No automation configured for this entity</div>';
    }

    // Plugins
    if (entityBp.plugins.length > 0) {
      content += this.generateEntityPluginsTable(entityBp.plugins);
    }

    // Flows
    if (entityBp.flows.length > 0) {
      content += this.generateEntityFlowsTable(entityBp.flows);
    }

    // Business Rules
    if (entityBp.businessRules.length > 0) {
      content += this.generateEntityBusinessRulesTable(entityBp.businessRules);
    }

    return content;
  }

  /**
   * Generate Execution Pipeline tab content for entity
   */
  private generateEntityPipelineTab(entityBp: EntityBlueprint): string {
    const entity = entityBp.entity;
    const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName;

    let content = `<div class="pipeline-intro">
      <p>This shows the execution order of server-side automation on <strong>${this.escapeHtml(displayName)}</strong>.</p>
    </div>`;

    // Group plugins by message
    const pluginsByMessage = new Map<string, PluginStep[]>();
    for (const plugin of entityBp.plugins) {
      const key = plugin.message;
      if (!pluginsByMessage.has(key)) {
        pluginsByMessage.set(key, []);
      }
      pluginsByMessage.get(key)!.push(plugin);
    }

    // Get entity-scoped business rules (they run server-side)
    const entityScopedBRs = entityBp.businessRules.filter(br => br.scopeName === 'Entity');

    // If no plugins, show business rules and flows
    if (entityBp.plugins.length === 0) {
      content += '<p><strong>No plugins registered on this entity.</strong></p>';

      if (entityScopedBRs.length > 0) {
        content += `<div class="entity-subsection">
          <h4>Business Rules (Server-side)</h4>
          ${this.generateEntityBusinessRulesTable(entityScopedBRs)}
        </div>`;
      }

      const dataverseFlows = entityBp.flows.filter(f => f.definition.triggerType === 'Dataverse');
      if (dataverseFlows.length > 0) {
        content += `<div class="entity-subsection">
          <h4>Dataverse Flows</h4>
          ${this.generateEntityFlowsTable(dataverseFlows)}
        </div>`;
      }

      return content;
    }

    // Generate execution order for each message
    for (const [message, plugins] of pluginsByMessage) {
      content += `<div class="pipeline-message">
        <h4>${this.escapeHtml(message)} Event</h4>`;

      // Sort plugins by stage then rank
      const sortedPlugins = [...plugins].sort((a, b) => {
        if (a.stage !== b.stage) return a.stage - b.stage;
        return a.rank - b.rank;
      });

      // Group by stage
      const byStage = new Map<number, PluginStep[]>();
      for (const plugin of sortedPlugins) {
        if (!byStage.has(plugin.stage)) {
          byStage.set(plugin.stage, []);
        }
        byStage.get(plugin.stage)!.push(plugin);
      }

      // Generate visual pipeline
      content += this.generatePipelineVisualization(byStage, entityScopedBRs);

      // Execution details table
      content += `<h5>Execution Details</h5>`;
      content += this.generatePipelineDetailsTable(sortedPlugins, entityScopedBRs);

      // Check for sync plugins (potential performance impact)
      const syncPlugins = sortedPlugins.filter(p => p.mode === 0);
      if (syncPlugins.length > 0) {
        content += `<div class="info-box">
          <strong>ℹ️ Synchronous Plugins</strong>
          <p>${syncPlugins.length} synchronous plugin(s) execute in this pipeline. Synchronous plugins block the transaction and should complete quickly.</p>
        </div>`;
      }

      content += `</div>`;
    }

    // Show all business rules
    if (entityBp.businessRules.length > 0) {
      content += `<div class="entity-subsection">
        <h4>All Business Rules</h4>
        <p>Business rules execute on the client (form) or server depending on their scope.</p>
        ${this.generateEntityBusinessRulesTable(entityBp.businessRules)}
      </div>`;
    }

    return content;
  }

  /**
   * Generate visual pipeline representation
   */
  private generatePipelineVisualization(byStage: Map<number, PluginStep[]>, businessRules: BusinessRule[]): string {
    let html = '<div class="pipeline-visual">';

    // Add business rules first
    if (businessRules.length > 0) {
      html += `<div class="pipeline-stage stage-business-rules">
        <div class="stage-header">Business Rules (Server-side, Entity-scoped)</div>
        <div class="stage-steps">`;

      businessRules.forEach((br, idx) => {
        const state = br.state === 'Active' ? 'active' : 'draft';
        html += `<div class="pipeline-step step-${state}">
          ${idx + 1}. ${this.escapeHtml(br.name)} <span class="step-badge badge-${state}">[${state.toUpperCase()}]</span>
        </div>`;
      });

      html += `</div></div>`;
    }

    // Add plugin stages
    for (const [stage, plugins] of byStage) {
      const stageName = plugins[0].stageName;
      const stageClass = this.getStageClass(stage);

      html += `<div class="pipeline-stage ${stageClass}">
        <div class="stage-header">Stage ${stage}: ${this.escapeHtml(stageName)}</div>
        <div class="stage-steps">`;

      plugins.forEach((plugin, idx) => {
        const mode = plugin.mode === 0 ? 'sync' : 'async';
        html += `<div class="pipeline-step step-${mode}">
          ${idx + 1}. ${this.escapeHtml(plugin.name)} <span class="step-badge badge-${mode}">[${mode.toUpperCase()}]</span>
          <span class="step-rank">Rank: ${plugin.rank}</span>
        </div>`;
      });

      html += `</div></div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Get CSS class for plugin stage
   */
  private getStageClass(stage: number): string {
    switch (stage) {
      case 10: return 'stage-prevalidation';
      case 20: return 'stage-preoperation';
      case 30: return 'stage-mainoperation';
      case 40: return 'stage-postoperation';
      default: return 'stage-unknown';
    }
  }

  /**
   * Generate pipeline details table
   */
  private generatePipelineDetailsTable(plugins: PluginStep[], businessRules: BusinessRule[]): string {
    const rows: string[] = [];

    // Add business rules first
    businessRules.forEach((br, idx) => {
      const stateBadge = br.state === 'Active'
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-warning">Draft</span>';
      rows.push(`<tr>
        <td>${idx + 1}</td>
        <td>Business Rule</td>
        <td>${this.escapeHtml(br.name)}</td>
        <td>Server-side (Entity scope)</td>
        <td>${stateBadge}</td>
        <td>-</td>
      </tr>`);
    });

    // Add plugins
    plugins.forEach((plugin, idx) => {
      const modeBadge = plugin.mode === 0
        ? '<span class="badge badge-sync">Synchronous</span>'
        : '<span class="badge badge-async">Asynchronous</span>';
      rows.push(`<tr>
        <td>${businessRules.length + idx + 1}</td>
        <td>Plugin</td>
        <td>${this.escapeHtml(plugin.name)}</td>
        <td>${this.escapeHtml(plugin.stageName)}</td>
        <td>${modeBadge}</td>
        <td>${plugin.rank}</td>
      </tr>`);
    });

    return `<table class="data-table pipeline-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Type</th>
          <th>Name</th>
          <th>Stage/Details</th>
          <th>Mode</th>
          <th>Rank</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('\n')}
      </tbody>
    </table>`;
  }

  /**
   * Generate business rules table for entity
   */
  private generateEntityBusinessRulesTable(businessRules: BusinessRule[]): string {
    if (businessRules.length === 0) return '';

    const rows = businessRules.map(br => {
      const stateBadge = br.state === 'Active'
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-warning">Draft</span>';
      return `<tr>
        <td>${this.escapeHtml(br.name)}</td>
        <td>${this.escapeHtml(br.scopeName)}</td>
        <td>${this.escapeHtml(br.definition.executionContext)}</td>
        <td>${stateBadge}</td>
        <td>${br.definition.conditions.length}</td>
        <td>${br.definition.actions.length}</td>
      </tr>`;
    }).join('\n');

    return `<div class="entity-subsection">
      <h4>Business Rules (${businessRules.length})</h4>
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Scope</th>
            <th>Context</th>
            <th>State</th>
            <th>Conditions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
  }

  /**
   * Generate relationships section
   */
  private generateRelationshipsSection(type: string, relationships: any[]): string {
    if (relationships.length === 0) return '';

    const rows = relationships.slice(0, 20).map(rel => {
      const schemaName = rel.SchemaName || 'N/A';
      const referencingEntity = rel.ReferencingEntity || rel.ReferencedEntity || 'N/A';
      const referencedAttribute = rel.ReferencedAttribute || rel.ReferencingAttribute || 'N/A';

      return `<tr>
        <td>${this.escapeHtml(schemaName)}</td>
        <td>${this.escapeHtml(referencingEntity)}</td>
        <td>${this.escapeHtml(referencedAttribute)}</td>
      </tr>`;
    }).join('\n');

    const moreText = relationships.length > 20 ? `<p class="table-note">Showing 20 of ${relationships.length} relationships</p>` : '';

    return `<div class="relationship-section">
      <h5>${type} (${relationships.length})</h5>
      <table class="data-table">
        <thead>
          <tr>
            <th>Schema Name</th>
            <th>Related Entity</th>
            <th>Related Attribute</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${moreText}
    </div>`;
  }

  /**
   * Generate plugins table section
   */
  htmlPluginsTable(plugins: PluginStep[]): string {
    if (plugins.length === 0) {
      return `<section id="plugins" class="content-section">
  <h2>Plugins</h2>
  <div class="empty-state">No plugins found</div>
</section>`;
    }

    const rows = plugins.map(plugin => {
      const images: string[] = [];
      if (plugin.preImage) images.push(plugin.preImage.imageType);
      if (plugin.postImage) images.push(plugin.postImage.imageType);
      const imagesText = images.length > 0 ? images.join(', ') : 'None';

      return `<tr>
  <td>${this.escapeHtml(plugin.name)}</td>
  <td>${this.escapeHtml(plugin.entity || 'N/A')}</td>
  <td>${this.escapeHtml(plugin.message || 'N/A')}</td>
  <td>${this.escapeHtml(plugin.stageName || 'N/A')}</td>
  <td>${this.escapeHtml(plugin.modeName || 'N/A')}</td>
  <td>${String(plugin.rank || 0)}</td>
  <td>${this.escapeHtml(imagesText)}</td>
</tr>`;
    }).join('\n');

    return `<section id="plugins" class="content-section">
  <h2>Plugins (${plugins.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="plugins-table">
      <thead>
        <tr>
          <th onclick="sortTable('plugins-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 2)">Message <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 3)">Stage <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 4)">Mode <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 5)">Rank <span class="sort-indicator"></span></th>
          <th>Images</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate flows table section
   */
  htmlFlowsTable(flows: Flow[]): string {
    if (flows.length === 0) {
      return `<section id="flows" class="content-section">
  <h2>Flows</h2>
  <div class="empty-state">No flows found</div>
</section>`;
    }

    const rows = flows.map(flow => {
      const entityDisplay = flow.entityDisplayName || flow.entity || 'N/A';
      const hasExternal = flow.hasExternalCalls;

      return `<tr>
  <td>${this.escapeHtml(flow.name)}</td>
  <td>${this.escapeHtml(entityDisplay)}</td>
  <td><span class="badge badge-${flow.state === 'Active' ? 'success' : flow.state === 'Draft' ? 'warning' : 'error'}">${flow.state}</span></td>
  <td>${this.escapeHtml(flow.definition.triggerEvent)}</td>
  <td>${this.escapeHtml(flow.definition.scopeType)}</td>
  <td>${flow.definition.actionsCount}</td>
  <td>${hasExternal ? '<span class="badge badge-warning">Yes</span>' : '<span class="badge badge-info">No</span>'}</td>
</tr>`;
    }).join('\n');

    return `<section id="flows" class="content-section">
  <h2>Flows (${flows.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="flows-table">
      <thead>
        <tr>
          <th onclick="sortTable('flows-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('flows-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('flows-table', 2)">State <span class="sort-indicator"></span></th>
          <th onclick="sortTable('flows-table', 3)">Trigger <span class="sort-indicator"></span></th>
          <th onclick="sortTable('flows-table', 4)">Scope <span class="sort-indicator"></span></th>
          <th onclick="sortTable('flows-table', 5)">Actions <span class="sort-indicator"></span></th>
          <th>External Calls</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate business rules table section
   */
  htmlBusinessRulesTable(businessRules: BusinessRule[]): string {
    if (businessRules.length === 0) {
      return `<section id="business-rules" class="content-section">
  <h2>Business Rules</h2>
  <div class="empty-state">No business rules found</div>
</section>`;
    }

    const rows = businessRules.map(rule => {
      const entityDisplay = rule.entityDisplayName || rule.entity;
      const conditions = rule.definition.conditions?.length || 0;
      const actions = rule.definition.actions?.length || 0;

      return `<tr>
  <td>${this.escapeHtml(rule.name)}</td>
  <td>${this.escapeHtml(entityDisplay)}</td>
  <td><span class="badge badge-${rule.state === 'Active' ? 'success' : 'warning'}">${rule.state}</span></td>
  <td>${this.escapeHtml(rule.scope)}</td>
  <td>${conditions}</td>
  <td>${actions}</td>
</tr>`;
    }).join('\n');

    return `<section id="business-rules" class="content-section">
  <h2>Business Rules (${businessRules.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="business-rules-table">
      <thead>
        <tr>
          <th onclick="sortTable('business-rules-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('business-rules-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('business-rules-table', 2)">State <span class="sort-indicator"></span></th>
          <th onclick="sortTable('business-rules-table', 3)">Scope <span class="sort-indicator"></span></th>
          <th onclick="sortTable('business-rules-table', 4)">Conditions <span class="sort-indicator"></span></th>
          <th onclick="sortTable('business-rules-table', 5)">Actions <span class="sort-indicator"></span></th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate classic workflows table section
   */
  htmlClassicWorkflowsTable(workflows: ClassicWorkflow[]): string {
    if (workflows.length === 0) {
      return `<section id="classic-workflows" class="content-section">
  <h2>Classic Workflows (Deprecated)</h2>
  <div class="empty-state">No classic workflows found</div>
</section>`;
    }

    const rows = workflows.map(workflow => {
      const entityDisplay = workflow.entityDisplayName || workflow.entity;
      const complexity = workflow.migrationRecommendation?.complexity || 'Unknown';
      const effort = workflow.migrationRecommendation?.effort || 'Unknown';

      return `<tr>
  <td>${this.escapeHtml(workflow.name)}</td>
  <td>${this.escapeHtml(entityDisplay)}</td>
  <td><span class="badge badge-${workflow.state === 'Active' ? 'success' : workflow.state === 'Draft' ? 'warning' : 'error'}">${workflow.state}</span></td>
  <td>${this.escapeHtml(workflow.modeName)}</td>
  <td><span class="badge badge-${complexity === 'Critical' ? 'error' : complexity === 'High' ? 'warning' : 'info'}">${complexity}</span></td>
  <td>${this.escapeHtml(effort)}</td>
</tr>`;
    }).join('\n');

    return `<section id="classic-workflows" class="content-section">
  <h2>Classic Workflows - Migration Required (${workflows.length})</h2>
  <div class="alert alert-warning">
    <strong>⚠️ Migration Required:</strong> Classic workflows are deprecated and will be removed. Please migrate to Power Automate cloud flows.
  </div>
  <div class="table-container">
    <table class="data-table sortable" id="classic-workflows-table">
      <thead>
        <tr>
          <th onclick="sortTable('classic-workflows-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 2)">State <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 3)">Mode <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 4)">Complexity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 5)">Effort <span class="sort-indicator"></span></th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate business process flows table section
   */
  htmlBusinessProcessFlowsTable(bpfs: BusinessProcessFlow[]): string {
    if (bpfs.length === 0) {
      return `<section id="business-process-flows" class="content-section">
  <h2>Business Process Flows</h2>
  <div class="empty-state">No business process flows found</div>
</section>`;
    }

    const rows = bpfs.map(bpf => {
      const entityDisplay = bpf.primaryEntityDisplayName || bpf.primaryEntity;
      const stages = bpf.definition.stages?.length || 0;
      const crossEntity = bpf.definition.crossEntityFlow;

      return `<tr>
  <td>${this.escapeHtml(bpf.name)}</td>
  <td>${this.escapeHtml(entityDisplay)}</td>
  <td><span class="badge badge-${bpf.state === 'Active' ? 'success' : 'warning'}">${bpf.state}</span></td>
  <td>${stages}</td>
  <td>${bpf.definition.totalSteps}</td>
  <td>${crossEntity ? '<span class="badge badge-info">Yes</span>' : 'No'}</td>
</tr>`;
    }).join('\n');

    return `<section id="business-process-flows" class="content-section">
  <h2>Business Process Flows (${bpfs.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="bpfs-table">
      <thead>
        <tr>
          <th onclick="sortTable('bpfs-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('bpfs-table', 1)">Primary Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('bpfs-table', 2)">State <span class="sort-indicator"></span></th>
          <th onclick="sortTable('bpfs-table', 3)">Stages <span class="sort-indicator"></span></th>
          <th onclick="sortTable('bpfs-table', 4)">Steps <span class="sort-indicator"></span></th>
          <th>Cross-Entity</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate web resources table section
   */
  htmlWebResourcesTable(webResources: WebResource[]): string {
    if (webResources.length === 0) {
      return `<section id="web-resources" class="content-section">
  <h2>Web Resources</h2>
  <div class="empty-state">No web resources found</div>
</section>`;
    }

    const rows = webResources.map(wr => {
      const sizeKB = (wr.contentSize / 1024).toFixed(2);
      const hasExternal = wr.hasExternalCalls;
      const deprecated = wr.isDeprecated;

      return `<tr>
  <td>${this.escapeHtml(wr.name)}</td>
  <td>${this.escapeHtml(wr.displayName)}</td>
  <td>${this.escapeHtml(wr.typeName)}</td>
  <td>${sizeKB} KB</td>
  <td>${hasExternal ? '<span class="badge badge-warning">Yes</span>' : 'No'}</td>
  <td>${deprecated ? '<span class="badge badge-error">Yes</span>' : 'No'}</td>
</tr>`;
    }).join('\n');

    return `<section id="web-resources" class="content-section">
  <h2>Web Resources (${webResources.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="web-resources-table">
      <thead>
        <tr>
          <th onclick="sortTable('web-resources-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('web-resources-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('web-resources-table', 2)">Type <span class="sort-indicator"></span></th>
          <th onclick="sortTable('web-resources-table', 3)">Size <span class="sort-indicator"></span></th>
          <th>External Calls</th>
          <th>Deprecated</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate custom APIs table section
   */
  htmlCustomAPIsTable(customAPIs: CustomAPI[]): string {
    if (customAPIs.length === 0) {
      return `<section id="custom-apis" class="content-section">
  <h2>Custom APIs</h2>
  <div class="empty-state">No custom APIs found</div>
</section>`;
    }

    const rows = customAPIs.map(api => {
      const type = api.isFunction ? 'Function' : 'Action';
      const binding = api.bindingType;
      const params = api.requestParameters?.length || 0;
      const responses = api.responseProperties?.length || 0;

      return `<tr>
  <td>${this.escapeHtml(api.uniqueName)}</td>
  <td>${this.escapeHtml(api.displayName)}</td>
  <td><span class="badge badge-${api.isFunction ? 'info' : 'primary'}">${type}</span></td>
  <td>${this.escapeHtml(binding)}</td>
  <td>${params}</td>
  <td>${responses}</td>
</tr>`;
    }).join('\n');

    return `<section id="custom-apis" class="content-section">
  <h2>Custom APIs (${customAPIs.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="custom-apis-table">
      <thead>
        <tr>
          <th onclick="sortTable('custom-apis-table', 0)">Unique Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('custom-apis-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('custom-apis-table', 2)">Type <span class="sort-indicator"></span></th>
          <th onclick="sortTable('custom-apis-table', 3)">Binding <span class="sort-indicator"></span></th>
          <th onclick="sortTable('custom-apis-table', 4)">Parameters <span class="sort-indicator"></span></th>
          <th onclick="sortTable('custom-apis-table', 5)">Responses <span class="sort-indicator"></span></th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate environment variables table section
   */
  htmlEnvironmentVariablesTable(envVars: EnvironmentVariable[]): string {
    if (envVars.length === 0) {
      return `<section id="environment-variables" class="content-section">
  <h2>Environment Variables</h2>
  <div class="empty-state">No environment variables found</div>
</section>`;
    }

    const rows = envVars.map(envVar => {
      const hasValue = !!envVar.currentValue;
      const required = envVar.isRequired;

      return `<tr>
  <td>${this.escapeHtml(envVar.schemaName)}</td>
  <td>${this.escapeHtml(envVar.displayName)}</td>
  <td>${this.escapeHtml(envVar.typeName)}</td>
  <td>${required ? '<span class="badge badge-error">Required</span>' : 'Optional'}</td>
  <td>${hasValue ? '<span class="badge badge-success">Set</span>' : '<span class="badge badge-warning">Not Set</span>'}</td>
</tr>`;
    }).join('\n');

    return `<section id="environment-variables" class="content-section">
  <h2>Environment Variables (${envVars.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="env-vars-table">
      <thead>
        <tr>
          <th onclick="sortTable('env-vars-table', 0)">Schema Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('env-vars-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('env-vars-table', 2)">Type <span class="sort-indicator"></span></th>
          <th onclick="sortTable('env-vars-table', 3)">Required <span class="sort-indicator"></span></th>
          <th>Value Status</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate connection references table section
   */
  htmlConnectionReferencesTable(connRefs: ConnectionReference[]): string {
    if (connRefs.length === 0) {
      return `<section id="connection-references" class="content-section">
  <h2>Connection References</h2>
  <div class="empty-state">No connection references found</div>
</section>`;
    }

    const rows = connRefs.map(connRef => {
      const connector = connRef.connectorDisplayName || 'Unknown';
      const connected = !!connRef.connectionId;

      return `<tr>
  <td>${this.escapeHtml(connRef.name)}</td>
  <td>${this.escapeHtml(connRef.displayName)}</td>
  <td>${this.escapeHtml(connector)}</td>
  <td>${connected ? '<span class="badge badge-success">Connected</span>' : '<span class="badge badge-error">Not Connected</span>'}</td>
</tr>`;
    }).join('\n');

    return `<section id="connection-references" class="content-section">
  <h2>Connection References (${connRefs.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="conn-refs-table">
      <thead>
        <tr>
          <th onclick="sortTable('conn-refs-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('conn-refs-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('conn-refs-table', 2)">Connector <span class="sort-indicator"></span></th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate external dependencies section
   */
  htmlExternalDependenciesSection(endpoints: ExternalEndpoint[] | undefined): string {
    if (!endpoints || endpoints.length === 0) {
      return `<section id="external-dependencies" class="content-section">
  <h2>External Dependencies</h2>
  <div class="empty-state">No external dependencies detected</div>
</section>`;
    }

    const rows = endpoints.map(endpoint => {
      const riskColor = endpoint.riskLevel === 'Trusted' ? 'success' : endpoint.riskLevel === 'Known' ? 'warning' : 'error';
      const riskFactorsText = endpoint.riskFactors.map(rf => rf.factor).join(', ') || 'None';

      return `<tr>
  <td>${this.escapeHtml(endpoint.domain)}</td>
  <td>${this.escapeHtml(endpoint.protocol.toUpperCase())}</td>
  <td><span class="badge badge-${riskColor}">${endpoint.riskLevel}</span></td>
  <td>${endpoint.callCount}</td>
  <td>${this.escapeHtml(riskFactorsText)}</td>
</tr>`;
    }).join('\n');

    return `<section id="external-dependencies" class="content-section">
  <h2>External Dependencies (${endpoints.length})</h2>
  <div class="alert alert-info">
    <strong>ℹ️ Note:</strong> External API calls can introduce security risks and performance concerns. Review each endpoint carefully.
  </div>
  <div class="table-container">
    <table class="data-table sortable" id="external-deps-table">
      <thead>
        <tr>
          <th onclick="sortTable('external-deps-table', 0)">Domain <span class="sort-indicator"></span></th>
          <th onclick="sortTable('external-deps-table', 1)">Protocol <span class="sort-indicator"></span></th>
          <th onclick="sortTable('external-deps-table', 2)">Risk Level <span class="sort-indicator"></span></th>
          <th onclick="sortTable('external-deps-table', 3)">Calls <span class="sort-indicator"></span></th>
          <th>Risk Factors</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate cross-entity automation section
   */
  htmlCrossEntitySection(links: CrossEntityLink[] | undefined): string {
    if (!links || links.length === 0) {
      return `<section id="cross-entity" class="content-section">
  <h2>Cross-Entity Automation</h2>
  <div class="empty-state">
    <strong>Note:</strong> Cross-entity automation analysis is coming in a future update.
  </div>
</section>`;
    }

    const rows = links.map(link => {
      return `<tr>
  <td>${this.escapeHtml(link.sourceEntityDisplayName)}</td>
  <td>${this.escapeHtml(link.targetEntityDisplayName)}</td>
  <td>${this.escapeHtml(link.automationType)}</td>
  <td>${this.escapeHtml(link.automationName)}</td>
  <td>${this.escapeHtml(link.operation)}</td>
  <td>${link.isAsynchronous ? 'Async' : 'Sync'}</td>
</tr>`;
    }).join('\n');

    return `<section id="cross-entity" class="content-section">
  <h2>Cross-Entity Automation (${links.length})</h2>
  <p class="section-description">Automation that operates on multiple entities (e.g., when Contact changes, update related Account)</p>
  <div class="table-container">
    <table class="data-table sortable" id="cross-entity-table">
      <thead>
        <tr>
          <th onclick="sortTable('cross-entity-table', 0)">Source Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('cross-entity-table', 1)">Target Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('cross-entity-table', 2)">Type <span class="sort-indicator"></span></th>
          <th onclick="sortTable('cross-entity-table', 3)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('cross-entity-table', 4)">Operation <span class="sort-indicator"></span></th>
          <th>Mode</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  }

  /**
   * Generate footer
   */
  htmlFooter(): string {
    return `<footer class="report-footer" role="contentinfo">
  <p>Generated by <strong>Power Platform Solution Blueprint (PPSB)</strong></p>
  <p>For PPTB Desktop | <a href="https://powerplatformtoolbox.com" target="_blank">powerplatformtoolbox.com</a></p>
</footer>`;
  }

  /**
   * Generate embedded JavaScript
   */
  htmlScripts(): string {
    return `<script>
${this.embeddedJavaScript()}
</script>`;
  }

  /**
   * Embedded CSS styles
   */
  private embeddedCSS(): string {
    return `    /* Base styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #242424;
      background-color: #fafafa;
      margin: 0;
      padding: 0;
    }

    /* Sidebar navigation */
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 250px;
      height: 100vh;
      background: #323130;
      color: white;
      overflow-y: auto;
      z-index: 1000;
      padding: 20px 0;
    }

    .sidebar-header {
      padding: 0 20px 20px;
      border-bottom: 1px solid #484644;
    }

    .sidebar-header h3 {
      color: white;
      font-size: 1.2rem;
      margin-bottom: 10px;
    }

    .nav-toggle {
      display: none;
      background: transparent;
      border: 1px solid white;
      color: white;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: 4px;
    }

    .nav-links {
      list-style: none;
      padding: 10px 0;
    }

    .nav-links li {
      margin: 0;
    }

    .nav-links a {
      display: block;
      padding: 10px 20px;
      color: #e1dfdd;
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s;
    }

    .nav-links a:hover {
      background-color: #484644;
      color: white;
    }

    .nav-footer {
      padding: 20px;
      border-top: 1px solid #484644;
      margin-top: 20px;
    }

    .btn-print {
      width: 100%;
      padding: 10px;
      background: #0078d4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-print:hover {
      background: #106ebe;
    }

    /* Main content */
    main {
      margin-left: 250px;
      padding: 30px;
      max-width: 1400px;
    }

    /* Header */
    .report-header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .report-header h1 {
      color: #0078d4;
      font-size: 2rem;
      margin-bottom: 20px;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .metadata-item {
      padding: 10px;
      background: #f3f2f1;
      border-radius: 4px;
    }

    .metadata-label {
      font-weight: 600;
      color: #605e5c;
      display: block;
      font-size: 0.9rem;
    }

    .metadata-value {
      font-size: 1.1rem;
      color: #242424;
      display: block;
      margin-top: 5px;
    }

    /* Content sections */
    .content-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .content-section h2 {
      color: #323130;
      font-size: 1.75rem;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0078d4;
    }

    .section-description {
      color: #605e5c;
      margin-bottom: 20px;
    }

    /* Summary cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }

    .summary-card {
      background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .summary-card.card-warning {
      background: linear-gradient(135deg, #ffb900 0%, #e3008c 100%);
    }

    .card-number {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .card-label {
      font-size: 0.9rem;
      opacity: 0.95;
    }

    /* ERD */
    .erd-legend {
      background: #f3f2f1;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .erd-legend h4 {
      margin-bottom: 10px;
      color: #323130;
    }

    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #d1d1d1;
    }

    .legend-label {
      font-size: 0.9rem;
    }

    .erd-diagram {
      margin-bottom: 40px;
    }

    .erd-diagram h3 {
      color: #323130;
      margin-bottom: 10px;
    }

    .diagram-description {
      color: #605e5c;
      margin-bottom: 15px;
    }

    .diagram-stats {
      color: #605e5c;
      font-size: 0.9rem;
      margin-top: 10px;
    }

    /* Accordion */
    .accordion-item {
      border: 1px solid #edebe9;
      border-radius: 4px;
      margin-bottom: 10px;
      overflow: hidden;
    }

    .accordion-header {
      background: #f3f2f1;
      padding: 15px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background-color 0.2s;
    }

    .accordion-header:hover {
      background: #edebe9;
    }

    .accordion-icon {
      font-weight: bold;
      font-size: 1.2rem;
      width: 20px;
      text-align: center;
      color: #0078d4;
    }

    .accordion-header h3 {
      flex: 1;
      font-size: 1.1rem;
      color: #323130;
      margin: 0;
    }

    .entity-badges {
      display: flex;
      gap: 8px;
    }

    .accordion-content {
      padding: 20px;
      border-top: 1px solid #edebe9;
    }

    .entity-details {
      margin-bottom: 20px;
      padding: 15px;
      background: #faf9f8;
      border-radius: 4px;
    }

    .entity-details p {
      margin: 5px 0;
      color: #323130;
    }

    .entity-subsection {
      margin-top: 20px;
    }

    .entity-subsection h4 {
      color: #323130;
      margin-bottom: 10px;
      font-size: 1rem;
    }

    /* Entity Tabs */
    .entity-tabs {
      margin-top: 15px;
    }

    .tabs-header {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #edebe9;
      margin-bottom: 20px;
    }

    .tab-button {
      padding: 12px 20px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      color: #605e5c;
      transition: all 0.2s;
    }

    .tab-button:hover {
      color: #323130;
      background: #faf9f8;
    }

    .tab-button.active {
      color: #0078d4;
      border-bottom-color: #0078d4;
      font-weight: 600;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    /* Entity Overview */
    .entity-description {
      padding: 15px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      margin-bottom: 20px;
      border-radius: 4px;
      color: #323130;
    }

    .entity-metadata {
      margin-bottom: 20px;
    }

    .metadata-table {
      width: 100%;
      border-collapse: collapse;
    }

    .metadata-table th {
      text-align: left;
      padding: 8px 12px;
      font-weight: 600;
      color: #605e5c;
      width: 40%;
      background: #faf9f8;
    }

    .metadata-table td {
      padding: 8px 12px;
      color: #323130;
    }

    .metadata-table tr {
      border-bottom: 1px solid #edebe9;
    }

    .automation-summary {
      background: #f3f2f1;
      padding: 15px;
      border-radius: 4px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e1dfdd;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-weight: 500;
      color: #605e5c;
    }

    .summary-value {
      font-weight: 600;
      color: #0078d4;
    }

    /* Pipeline Visualization */
    .pipeline-intro {
      margin-bottom: 20px;
      padding: 15px;
      background: #e7f3ff;
      border-left: 4px solid #0078d4;
      border-radius: 4px;
    }

    .pipeline-message {
      margin-bottom: 30px;
      padding: 20px;
      background: #fafafa;
      border-radius: 4px;
    }

    .pipeline-message h4 {
      color: #323130;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #edebe9;
    }

    .pipeline-message h5 {
      color: #323130;
      margin: 20px 0 10px;
    }

    .pipeline-visual {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border: 1px solid #edebe9;
      border-radius: 4px;
    }

    .pipeline-stage {
      margin-bottom: 15px;
      border-left: 4px solid #d1d1d1;
      padding-left: 15px;
    }

    .stage-business-rules {
      border-left-color: #ffc107;
    }

    .stage-prevalidation {
      border-left-color: #dc3545;
    }

    .stage-preoperation {
      border-left-color: #fd7e14;
    }

    .stage-mainoperation {
      border-left-color: #0078d4;
    }

    .stage-postoperation {
      border-left-color: #28a745;
    }

    .stage-header {
      font-weight: 600;
      color: #323130;
      margin-bottom: 10px;
      font-size: 0.95rem;
    }

    .stage-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pipeline-step {
      padding: 10px 15px;
      background: #fafafa;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .step-sync {
      border-left: 3px solid #dc3545;
    }

    .step-async {
      border-left: 3px solid #28a745;
    }

    .step-active {
      border-left: 3px solid #28a745;
    }

    .step-draft {
      border-left: 3px solid #ffc107;
    }

    .step-badge {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-sync {
      background: #f8d7da;
      color: #721c24;
    }

    .badge-async {
      background: #d4edda;
      color: #155724;
    }

    .badge-active {
      background: #d4edda;
      color: #155724;
    }

    .badge-draft {
      background: #fff3cd;
      color: #856404;
    }

    .step-rank {
      font-size: 0.85rem;
      color: #605e5c;
    }

    .info-box {
      margin: 15px 0;
      padding: 15px;
      background: #e7f3ff;
      border-left: 4px solid #0078d4;
      border-radius: 4px;
    }

    .info-box strong {
      display: block;
      margin-bottom: 5px;
      color: #323130;
    }

    .info-box p {
      margin: 0;
      color: #605e5c;
    }

    .pipeline-table {
      margin-top: 15px;
    }

    .relationship-section {
      margin-top: 15px;
    }

    .relationship-section h5 {
      color: #323130;
      margin-bottom: 10px;
      font-size: 0.95rem;
    }

    .table-note {
      margin-top: 10px;
      color: #605e5c;
      font-size: 0.9rem;
      font-style: italic;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    .data-table thead {
      background: #f3f2f1;
    }

    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #323130;
      border-bottom: 2px solid #d1d1d1;
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .data-table th:hover {
      background: #edebe9;
    }

    .sort-indicator {
      margin-left: 5px;
      color: #605e5c;
      font-size: 0.8rem;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #edebe9;
      color: #323130;
    }

    .data-table tbody tr:hover {
      background: #faf9f8;
    }

    .data-table tbody tr:nth-child(even) {
      background: #f9f9f9;
    }

    .data-table tbody tr:nth-child(even):hover {
      background: #f3f2f1;
    }

    .table-note {
      margin-top: 10px;
      color: #605e5c;
      font-size: 0.9rem;
      font-style: italic;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-success {
      background: #dff6dd;
      color: #107c10;
    }

    .badge-warning {
      background: #fff4ce;
      color: #8a5100;
    }

    .badge-error {
      background: #fde7e9;
      color: #d13438;
    }

    .badge-info {
      background: #cfe4f7;
      color: #004578;
    }

    .badge-primary {
      background: #deecf9;
      color: #0078d4;
    }

    /* Security-specific styles */
    .profile-badge {
      display: inline-block;
      padding: 6px 12px;
      margin: 4px;
      background: #f3f2f1;
      border: 1px solid #d2d0ce;
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .profile-badge .permissions {
      color: #0078d4;
      font-weight: 600;
      margin-left: 4px;
    }

    .legend {
      padding: 12px;
      background: #faf9f8;
      border-left: 3px solid #0078d4;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #605e5c;
      margin-top: 10px;
    }

    .center {
      text-align: center;
    }

    /* Alerts */
    .alert {
      padding: 15px 20px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .alert-warning {
      background: #fff4ce;
      border-left: 4px solid #ffb900;
      color: #3d2e00;
    }

    .alert-info {
      background: #deecf9;
      border-left: 4px solid #0078d4;
      color: #004578;
    }

    .alert strong {
      display: block;
      margin-bottom: 5px;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #605e5c;
      font-style: italic;
    }

    /* Footer */
    .report-footer {
      text-align: center;
      padding: 30px;
      color: #605e5c;
      font-size: 0.9rem;
      margin-top: 40px;
      border-top: 1px solid #edebe9;
    }

    .report-footer a {
      color: #0078d4;
      text-decoration: none;
    }

    .report-footer a:hover {
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .nav-toggle {
        display: inline-block;
      }

      main {
        margin-left: 0;
        padding: 15px;
      }

      .metadata-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }
    }

    /* Print styles */
    @media print {
      .sidebar,
      .nav-toggle,
      .btn-print {
        display: none !important;
      }

      main {
        margin-left: 0;
        padding: 0;
      }

      .content-section {
        page-break-inside: avoid;
        box-shadow: none;
      }

      .accordion-content {
        display: block !important;
      }

      .accordion-icon {
        display: none;
      }

      body {
        background: white;
      }
    }`;
  }

  /**
   * Embedded JavaScript for interactivity
   */
  private embeddedJavaScript(): string {
    return `    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    });

    // Accordion toggle
    function toggleAccordion(id) {
      const content = document.getElementById(id);
      const icon = document.getElementById('icon-' + id);

      if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        icon.textContent = '−';
      } else {
        content.style.display = 'none';
        icon.textContent = '+';
      }
    }

    // Table sorting
    function sortTable(tableId, columnIndex) {
      const table = document.getElementById(tableId);
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const header = table.querySelectorAll('th')[columnIndex];
      const isAscending = header.classList.contains('sort-asc');

      // Clear all sort indicators
      table.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) indicator.textContent = '';
      });

      // Sort rows
      rows.sort((a, b) => {
        const aVal = a.cells[columnIndex].textContent.trim();
        const bVal = b.cells[columnIndex].textContent.trim();

        // Try to parse as number
        const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return isAscending ? bNum - aNum : aNum - bNum;
        }

        // String comparison
        return isAscending ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });

      // Update DOM
      rows.forEach(row => tbody.appendChild(row));

      // Update sort indicator
      if (isAscending) {
        header.classList.add('sort-desc');
        header.querySelector('.sort-indicator').textContent = '▼';
      } else {
        header.classList.add('sort-asc');
        header.querySelector('.sort-indicator').textContent = '▲';
      }
    }

    // Smooth scroll for navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebar');

    if (navToggle && sidebar) {
      navToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          if (!sidebar.contains(e.target) && !navToggle.contains(e.target)) {
            sidebar.classList.remove('open');
          }
        }
      });
    }

    // Entity tab switching
    function switchEntityTab(entityId, tabName) {
      // Hide all tab contents for this entity
      const allTabContents = document.querySelectorAll('[id^="' + entityId + '-"]');
      allTabContents.forEach(tab => {
        tab.classList.remove('active');
      });

      // Remove active class from all tab buttons in this entity
      const entityAccordion = document.getElementById(entityId);
      if (entityAccordion) {
        const tabButtons = entityAccordion.parentElement.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
        });
      }

      // Show selected tab content
      const selectedTab = document.getElementById(entityId + '-' + tabName);
      if (selectedTab) {
        selectedTab.classList.add('active');
      }

      // Add active class to clicked button
      event.target.classList.add('active');
    }

    // Security tab switching
    function switchTab(sectionId, tabName) {
      // Hide all tab contents in this section
      const section = document.getElementById(sectionId);
      if (section) {
        const allTabs = section.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
          tab.classList.remove('active');
        });

        // Remove active class from all tab buttons in this section
        const tabButtons = section.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(sectionId + '-' + tabName);
        if (selectedTab) {
          selectedTab.classList.add('active');
        }

        // Add active class to clicked button
        event.target.classList.add('active');
      }
    }`;
  }

  /**
   * Generate Security section (roles and field security profiles)
   */
  htmlSecuritySection(
    securityRoles?: import('../../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail[],
    fieldSecurityProfiles?: import('../../discovery/FieldSecurityProfileDiscovery.js').FieldSecurityProfile[],
    attributeMaskingRules?: import('../../discovery/ColumnSecurityDiscovery.js').AttributeMaskingRule[],
    columnSecurityProfiles?: import('../../discovery/ColumnSecurityDiscovery.js').ColumnSecurityProfile[]
  ): string {
    if (!securityRoles && !fieldSecurityProfiles && !attributeMaskingRules && !columnSecurityProfiles) {
      return '';
    }

    if (!securityRoles?.length && !fieldSecurityProfiles?.length && !attributeMaskingRules?.length && !columnSecurityProfiles?.length) {
      return '';
    }

    let html = `
      <section id="security" class="content-section">
        <h2 class="section-title">🔒 Security</h2>
        <p class="section-description">Security roles and field security profiles in the selected solution(s).</p>

        <div class="tabs-container">
          <div class="tabs">`;

    // Add tabs
    const hasRoles = securityRoles && securityRoles.length > 0;
    const hasProfiles = fieldSecurityProfiles && fieldSecurityProfiles.length > 0;
    const hasMasking = attributeMaskingRules && attributeMaskingRules.length > 0;
    const hasColumnSecurity = columnSecurityProfiles && columnSecurityProfiles.length > 0;
    const firstTab = hasRoles ? 'roles' : hasProfiles ? 'profiles' : hasMasking ? 'masking' : 'columnsecurity';

    if (hasRoles) {
      html += `<button class="tab-button active" onclick="switchTab('security', 'roles')">Security Roles (${securityRoles.length})</button>`;
    }
    if (hasProfiles) {
      html += `<button class="tab-button${firstTab === 'profiles' ? ' active' : ''}" onclick="switchTab('security', 'profiles')">Field Security Profiles (${fieldSecurityProfiles.length})</button>`;
    }
    if (hasMasking) {
      html += `<button class="tab-button${firstTab === 'masking' ? ' active' : ''}" onclick="switchTab('security', 'masking')">Attribute Masking (${attributeMaskingRules.length})</button>`;
    }
    if (hasColumnSecurity) {
      html += `<button class="tab-button${firstTab === 'columnsecurity' ? ' active' : ''}" onclick="switchTab('security', 'columnsecurity')">Column Security (${columnSecurityProfiles.length})</button>`;
    }

    html += `</div>`;

    // Security Roles Tab
    if (securityRoles && securityRoles.length > 0) {
      html += `
          <div class="tab-content${firstTab === 'roles' ? ' active' : ''}" id="security-roles">
            <h3>Security Roles</h3>

            <div class="subsection">
              <h4>Special Permissions Matrix</h4>
              <p>This table shows which security roles have special/miscellaneous permissions.</p>
              ${this.generateSpecialPermissionsTable(securityRoles)}
            </div>

            <div class="subsection">
              <h4>Role Details</h4>
              ${this.generateSecurityRolesAccordion(securityRoles)}
            </div>
          </div>`;
    }

    // Field Security Profiles Tab
    if (fieldSecurityProfiles && fieldSecurityProfiles.length > 0) {
      html += `
          <div class="tab-content${firstTab === 'profiles' ? ' active' : ''}" id="security-profiles">
            <h3>Field Security Profiles</h3>
            <p>Field security profiles control who can read, create, or update specific secured fields.</p>
            ${this.generateFieldSecurityProfilesTable(fieldSecurityProfiles)}
            <p class="legend"><strong>Note:</strong> Field-level permissions for specific entities are documented in each entity's schema tab.</p>
          </div>`;
    }

    // Attribute Masking Tab
    if (attributeMaskingRules && attributeMaskingRules.length > 0) {
      html += `
          <div class="tab-content${firstTab === 'masking' ? ' active' : ''}" id="security-masking">
            <h3>Attribute Masking Rules</h3>
            <p>Attribute masking rules control how sensitive data is masked when displayed to users without appropriate permissions.</p>
            ${this.generateAttributeMaskingTable(attributeMaskingRules)}
            <p class="legend"><strong>Masking Types:</strong> Full = Entire value masked, Partial = Part of value shown, Email = Email format preserved, Custom = Custom masking format</p>
          </div>`;
    }

    // Column Security Profiles Tab
    if (columnSecurityProfiles && columnSecurityProfiles.length > 0) {
      html += `
          <div class="tab-content${firstTab === 'columnsecurity' ? ' active' : ''}" id="security-columnsecurity">
            <h3>Column Security Profiles</h3>
            <p>Column security profiles define which users can access specific secured columns across entities.</p>
            ${this.generateColumnSecurityTable(columnSecurityProfiles)}
            <p class="legend"><strong>Note:</strong> Column-level permissions control create, read, and update access to secured fields.</p>
          </div>`;
    }

    html += `
        </div>
      </section>`;

    return html;
  }

  /**
   * Generate special permissions matrix table
   */
  private generateSpecialPermissionsTable(securityRoles: import('../../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail[]): string {
    const specialPermissionKeys: Array<keyof import('../../discovery/SecurityRoleDiscovery.js').SpecialPermissions> = [
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

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Business Unit</th>`;

    for (const key of specialPermissionKeys) {
      html += `<th>${this.formatSpecialPermissionName(key)}</th>`;
    }

    html += `
          </tr>
        </thead>
        <tbody>`;

    for (const role of securityRoles) {
      html += `
          <tr>
            <td><strong>${this.escapeHtml(role.name)}</strong></td>
            <td>${this.escapeHtml(role.businessunitname || 'Unknown')}</td>`;

      for (const key of specialPermissionKeys) {
        html += `<td class="center">${role.specialPermissions[key] ? '✓' : ''}</td>`;
      }

      html += `</tr>`;
    }

    html += `
        </tbody>
      </table>`;

    return html;
  }

  /**
   * Generate security roles accordion with entity permissions
   */
  private generateSecurityRolesAccordion(securityRoles: import('../../discovery/SecurityRoleDiscovery.js').SecurityRoleDetail[]): string {
    let html = '<div class="accordion">';

    for (let i = 0; i < securityRoles.length; i++) {
      const role = securityRoles[i];
      html += `
        <div class="accordion-item">
          <div class="accordion-header" onclick="toggleAccordion('role-${i}')">
            <span class="accordion-icon" id="icon-role-${i}">+</span>
            <div class="accordion-title">
              <strong>${this.escapeHtml(role.name)}</strong>
              <span class="badge">${role.totalEntities} entities</span>
              ${role.hasSystemAdminPrivileges ? '<span class="badge badge-warning">System Admin</span>' : ''}
              ${role.ismanaged ? '<span class="badge badge-info">Managed</span>' : ''}
            </div>
          </div>
          <div class="accordion-content" id="role-${i}" style="display: none;">
            <p><strong>Business Unit:</strong> ${this.escapeHtml(role.businessunitname || 'Unknown')}</p>
            ${role.description ? `<p><strong>Description:</strong> ${this.escapeHtml(role.description)}</p>` : ''}

            <h5>Entity Permissions</h5>
            ${this.generateEntityPermissionsTable(role.entityPermissions)}
          </div>
        </div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Generate entity permissions table for a security role
   */
  private generateEntityPermissionsTable(entityPermissions: import('../../discovery/SecurityRoleDiscovery.js').EntityPermission[]): string {
    if (entityPermissions.length === 0) {
      return '<p class="empty-state">No entity permissions defined</p>';
    }

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Entity</th>
            <th>Create</th>
            <th>Read</th>
            <th>Write</th>
            <th>Delete</th>
            <th>Append</th>
            <th>AppendTo</th>
            <th>Assign</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>`;

    for (const entityPerm of entityPermissions) {
      // Skip entities with no privileges
      if (entityPerm.privileges.length === 0) {
        continue;
      }

      const privMap = new Map(entityPerm.privileges.map(p => [p.type, p]));

      html += `
          <tr>
            <td><strong>${this.escapeHtml(entityPerm.entityLogicalName)}</strong></td>`;

      for (const type of ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share']) {
        const priv = privMap.get(type as any);
        html += `<td class="center">${priv ? this.escapeHtml(priv.depth) : ''}</td>`;
      }

      html += `</tr>`;
    }

    html += `
        </tbody>
      </table>
      <p class="legend"><strong>Privilege Depth:</strong> Basic = User, Local = Business Unit, Deep = Parent+Child BU, Global = Organization</p>`;

    return html;
  }

  /**
   * Generate field security profiles table
   */
  private generateFieldSecurityProfilesTable(fieldSecurityProfiles: import('../../discovery/FieldSecurityProfileDiscovery.js').FieldSecurityProfile[]): string {
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Profile Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>`;

    for (const profile of fieldSecurityProfiles) {
      html += `
          <tr>
            <td><strong>${this.escapeHtml(profile.name)}</strong></td>
            <td>${profile.description ? this.escapeHtml(profile.description) : '<em>No description</em>'}</td>
          </tr>`;
    }

    html += `
        </tbody>
      </table>`;

    return html;
  }

  /**
   * Generate attribute masking rules table
   */
  private generateAttributeMaskingTable(attributeMaskingRules: import('../../discovery/ColumnSecurityDiscovery.js').AttributeMaskingRule[]): string {
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Entity</th>
            <th>Attribute</th>
            <th>Masking Type</th>
            <th>Managed</th>
          </tr>
        </thead>
        <tbody>`;

    for (const rule of attributeMaskingRules) {
      const maskingType = rule.maskingtype === 1 ? 'Full' : rule.maskingtype === 2 ? 'Partial' : rule.maskingtype === 3 ? 'Email' : 'Custom';
      html += `
          <tr>
            <td><strong>${this.escapeHtml(rule.entitylogicalname)}</strong></td>
            <td>${this.escapeHtml(rule.attributelogicalname)}</td>
            <td><span class="badge">${maskingType}</span></td>
            <td>${rule.ismanaged ? '<span class="badge">Managed</span>' : ''}</td>
          </tr>`;
    }

    html += `
        </tbody>
      </table>`;

    return html;
  }

  /**
   * Generate column security profiles table
   */
  private generateColumnSecurityTable(columnSecurityProfiles: import('../../discovery/ColumnSecurityDiscovery.js').ColumnSecurityProfile[]): string {
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Profile Name</th>
            <th>Description</th>
            <th>Managed</th>
          </tr>
        </thead>
        <tbody>`;

    for (const profile of columnSecurityProfiles) {
      html += `
          <tr>
            <td><strong>${this.escapeHtml(profile.name)}</strong></td>
            <td>${profile.description ? this.escapeHtml(profile.description) : '<em>No description</em>'}</td>
            <td>${profile.ismanaged ? '<span class="badge">Managed</span>' : ''}</td>
          </tr>`;
    }

    html += `
        </tbody>
      </table>`;

    return html;
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

  /**
   * Generate field security section for entity schema
   */
  private generateFieldSecuritySection(fieldSecurity: import('../../types/blueprint.js').EntityBlueprint['fieldSecurity']): string {
    if (!fieldSecurity || fieldSecurity.securedFields.length === 0) {
      return '';
    }

    let html = `
      <div class="entity-subsection">
        <h4>🛡️ Field Security (${fieldSecurity.securedFields.length} secured field${fieldSecurity.securedFields.length > 1 ? 's' : ''})</h4>
        <p class="subsection-description">The following fields have field-level security permissions:</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Profiles with Access</th>
            </tr>
          </thead>
          <tbody>`;

    for (const securedField of fieldSecurity.securedFields) {
      const profileDetails = securedField.profiles.map(p => {
        const permissions = [];
        if (p.canRead) permissions.push('R');
        if (p.canCreate) permissions.push('C');
        if (p.canUpdate) permissions.push('U');
        return `<div class="profile-badge">${this.escapeHtml(p.profileName)} <span class="permissions">(${permissions.join(', ')})</span></div>`;
      }).join('');

      html += `
            <tr>
              <td><strong>${this.escapeHtml(securedField.attributeLogicalName)}</strong></td>
              <td>${profileDetails}</td>
            </tr>`;
    }

    html += `
          </tbody>
        </table>
        <p class="legend"><strong>Permissions:</strong> R = Read, C = Create, U = Update</p>
      </div>`;

    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const textNode = text || '';
    return textNode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
