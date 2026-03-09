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
  ExternalEndpoint,
} from '../../types/blueprint.js';
import type { CrossEntityAnalysisResult } from '../../types/crossEntityTrace.js';
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
  <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; default-src 'self' 'unsafe-inline' data:">
  <title>${this.escapeHtml(title)}</title>
  <script>
    // Prevent CDN library storage errors from blocking render in Edge
    // when opened as a local file (file:// protocol).
    // Must run BEFORE CDN scripts load so the shim is in place.
    (function() {
      try { localStorage.setItem('__test', '1'); localStorage.removeItem('__test'); }
      catch(e) {
        var noop = { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {}, clear: function() {}, key: function() { return null; }, length: 0 };
        try { Object.defineProperty(window, 'localStorage', { value: noop, writable: false }); } catch(_) {}
        try { Object.defineProperty(window, 'sessionStorage', { value: noop, writable: false }); } catch(_) {}
      }
    })();
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/cytoscape@3.33.1/dist/cytoscape.min.js"></script>
  <script>
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });
    }
  </script>
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
    <li><a href="#summary">${this.navIcon('summary')} Summary</a></li>
    <li><a href="#erd">${this.navIcon('erd')} Entity Relationship Diagram</a></li>
    <li><a href="#entities">${this.navIcon('entities')} Entities</a></li>
    <li><a href="#plugins">${this.navIcon('plugins')} Plugins</a></li>
    <li><a href="#flows">${this.navIcon('flows')} Flows</a></li>
    <li><a href="#business-rules">${this.navIcon('business-rules')} Business Rules</a></li>
    <li><a href="#classic-workflows">${this.navIcon('classic-workflows')} Classic Workflows</a></li>
    <li><a href="#business-process-flows">${this.navIcon('business-process-flows')} Business Process Flows</a></li>
    <li><a href="#web-resources">${this.navIcon('web-resources')} Web Resources</a></li>
    <li><a href="#custom-apis">${this.navIcon('custom-apis')} Custom APIs</a></li>
    <li><a href="#environment-variables">${this.navIcon('environment-variables')} Environment Variables</a></li>
    <li><a href="#connection-references">${this.navIcon('connection-references')} Connection References</a></li>
    <li><a href="#security">${this.navIcon('security')} Security</a></li>
    <li><a href="#external-dependencies">${this.navIcon('external-dependencies')} External Dependencies</a></li>
    <li><a href="#cross-entity">${this.navIcon('cross-entity')} Cross-Entity Automation</a></li>
  </ul>
  <div class="nav-footer">
    <button class="btn-print" onclick="window.print()" aria-label="Print blueprint">${this.navIcon('print')} Print</button>
  </div>
</nav>`;
  }

  /**
   * Generate header section
   */
  htmlHeader(metadata: BlueprintMetadata): string {
    const generatedDate = metadata.generatedAt.toLocaleString();
    const solutionsHtml = metadata.solutionNames && metadata.solutionNames.length > 0
      ? `<div class="metadata-item">
      <span class="metadata-label">Solutions:</span>
      <span class="metadata-value">${this.escapeHtml(metadata.solutionNames.join(', '))}</span>
    </div>`
      : '';
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
    ${solutionsHtml}
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

    // Use Cytoscape interactive graph when graphData is available
    const graphData = erd.graphData;
    if (graphData && graphData.nodes.length > 0) {
      // Filter out entities with no relationships (same as in-app behaviour)
      const connectedIds = new Set<string>();
      graphData.edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
      const filteredGraphData = {
        nodes: graphData.nodes.filter(n => connectedIds.has(n.id)),
        edges: graphData.edges,
      };

      // Only use Cytoscape block when there are connected entities to display
      if (filteredGraphData.nodes.length > 0) {
      const isolatedCount = graphData.nodes.length - filteredGraphData.nodes.length;
      // Embed graph data as a JSON data-block (<script type="application/json">).
      // The browser never evaluates this as JavaScript so there is zero risk of
      // SyntaxError from entity names/labels containing <, >, &, U+2028, etc.
      // The only escape required is to prevent the HTML parser from seeing
      // </script inside the text, which we handle with the JSON-legal \/ escape.
      const safeJson = JSON.stringify(filteredGraphData)
        .replace(/<\/script/gi, '<\\/script');

      return `<section id="erd" class="content-section">
  <h2>Entity Relationship Diagram</h2>
  <p>${filteredGraphData.nodes.length} entities · ${graphData.edges.length} relationships in scope${isolatedCount > 0 ? ` · ${isolatedCount} entities with no relationships not shown` : ''}</p>
  ${legendHtml}
  <div class="erd-controls" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
    <span style="font-size:12px;color:#666;">Layout:</span>
    <button class="btn-sm" onclick="erdLayout('cose')">Smart</button>
    <button class="btn-sm" onclick="erdLayout('breadthfirst')">Hierarchical</button>
    <button class="btn-sm" onclick="erdFit()">Fit</button>
    <span style="width:1px;height:20px;background:#ddd;margin:0 4px;align-self:center;display:inline-block;"></span>
    <input type="text" id="erdSearch" placeholder="Search entities…" oninput="erdSearch(this.value)"
      style="padding:4px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;width:160px;">
    <span style="font-size:12px;color:#666;">Hops:</span>
    <button class="btn-sm" id="hop1Btn" style="font-weight:bold;" onclick="erdSetHops(1)">1</button>
    <button class="btn-sm" id="hop2Btn" onclick="erdSetHops(2)">2</button>
    <button class="btn-sm" id="hop3Btn" onclick="erdSetHops(3)">3</button>
    <button class="btn-sm" id="isolateBtn" onclick="erdIsolate()" disabled>Isolate</button>
    <button class="btn-sm" id="clearIsolateBtn" onclick="erdClearIsolate()" style="display:none;">Show all</button>
    <span style="width:1px;height:20px;background:#ddd;margin:0 4px;align-self:center;display:inline-block;"></span>
    <button class="btn-sm" onclick="downloadErdPng()">&#8595; PNG</button>
    <button class="btn-sm" onclick="downloadErdSvg()">&#8595; SVG</button>
  </div>
  <div style="position:relative;">
    <div id="cy" style="width:100%;height:700px;border:1px solid #e0e0e0;border-radius:8px;background:#fafafa;"></div>
    <div style="position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:2px;z-index:5;background:#fff;border:1px solid #ddd;border-radius:6px;padding:2px;box-shadow:0 2px 8px rgba(0,0,0,.12);opacity:0.75;transition:opacity 0.15s ease;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.75'">
      <button class="btn-sm" onclick="if(_cy){_cy.zoom({level:_cy.zoom()*1.2,renderedPosition:{x:_cy.width()/2,y:_cy.height()/2}});}" title="Zoom in">+</button>
      <button class="btn-sm" onclick="if(_cy){_cy.zoom({level:_cy.zoom()/1.2,renderedPosition:{x:_cy.width()/2,y:_cy.height()/2}});}" title="Zoom out">−</button>
      <button class="btn-sm" onclick="erdFit()" title="Fit to screen">⤢</button>
    </div>
  </div>
  <p style="font-size:11px;color:#888;margin-top:4px;">Click node to select · Hover edge for details · Scroll to zoom · Drag to pan · Solid = 1:N · Dashed = N:N</p>
  <script type="application/json" id="erd-data">
${safeJson}
  </script>
</section>`;
      } // end filteredGraphData.nodes.length > 0
    } // end graphData.nodes.length > 0

    // Fallback: Mermaid diagram
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
      const formsCount = entityBp.forms?.length || 0;

      // Check if entity has server-side automation for execution pipeline
      const hasExecutionPipeline = this.hasEntityExecutionPipeline(entityBp);

      return `<div class="accordion-item">
  <div class="accordion-header" onclick="toggleAccordion('entity-${index}')">
    <span class="accordion-icon" id="icon-entity-${index}">+</span>
    <h3>${this.escapeHtml(displayName)}</h3>
    <span class="entity-badges">
      ${attributeCount > 0 ? `<span class="badge badge-info">${attributeCount} fields</span>` : ''}
      ${formsCount > 0 ? `<span class="badge badge-secondary">${formsCount} forms</span>` : ''}
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
        ${formsCount > 0 ? `<button class="tab-button" onclick="switchEntityTab('entity-${index}', 'forms')">Forms & Web Resources</button>` : ''}
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

      ${formsCount > 0 ? `<!-- Forms Tab -->
      <div class="tab-content" id="entity-${index}-forms">
        ${this.generateEntityFormsTab(entityBp)}
      </div>` : ''}

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
   * Generate Forms & Web Resources tab content for entity
   */
  private generateEntityFormsTab(entityBp: EntityBlueprint): string {
    if (!entityBp.forms || entityBp.forms.length === 0) {
      return '<div class="empty-state">No forms found</div>';
    }

    const formsHtml = entityBp.forms.map(form => {
      const webResourcesHtml = form.libraries.length > 0 ? `
        <div class="entity-subsection" style="margin-top: 12px;">
          <h5 style="font-size: 0.9em; margin-bottom: 8px;">Web Resources (${form.libraries.length})</h5>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${form.libraries.map(lib => `<span class="badge badge-info" style="font-family: monospace; font-size: 0.85em;">${this.escapeHtml(lib)}</span>`).join('')}
          </div>
        </div>` : '';

      const eventHandlersHtml = form.eventHandlers.length > 0 ? `
        <div class="entity-subsection" style="margin-top: 12px;">
          <h5 style="font-size: 0.9em; margin-bottom: 8px;">Event Handlers (${form.eventHandlers.length})</h5>
          <table class="data-table" style="font-size: 0.9em;">
            <thead>
              <tr>
                <th>Event</th>
                <th>Library</th>
                <th>Function</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${form.eventHandlers.map(handler => `
                <tr>
                  <td>${this.escapeHtml(handler.event)}${handler.attribute ? ` <span class="badge badge-secondary" style="font-size: 0.8em;">${this.escapeHtml(handler.attribute)}</span>` : ''}</td>
                  <td style="font-family: monospace;">${this.escapeHtml(handler.libraryName)}</td>
                  <td style="font-family: monospace;">${this.escapeHtml(handler.functionName)}${handler.parameters ? ` <span style="color: #666; font-size: 0.85em;">(${this.escapeHtml(handler.parameters)})</span>` : ''}</td>
                  <td><span class="badge ${handler.enabled ? 'badge-success' : 'badge-warning'}">${handler.enabled ? 'Enabled' : 'Disabled'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : '';

      const noContentHtml = form.libraries.length === 0 && form.eventHandlers.length === 0 ?
        '<p style="color: #666; font-style: italic; margin-top: 12px;">No web resources or event handlers registered</p>' : '';

      return `
        <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <h4 style="margin: 0; flex: 1;">${this.escapeHtml(form.name)}</h4>
            <span class="badge badge-primary">${this.escapeHtml(form.typeName)}</span>
          </div>
          ${webResourcesHtml}
          ${eventHandlersHtml}
          ${noContentHtml}
        </div>
      `;
    }).join('');

    return `<div>${formsHtml}</div>`;
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
          <strong>${this.alertIcon('info')} Synchronous Plugins</strong>
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
  <td><span class="badge badge-${plugin.state === 'Enabled' ? 'success' : 'error'}">${plugin.state}</span></td>
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
          <th onclick="sortTable('plugins-table', 2)">State <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 3)">Message <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 4)">Stage <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 5)">Mode <span class="sort-indicator"></span></th>
          <th onclick="sortTable('plugins-table', 6)">Rank <span class="sort-indicator"></span></th>
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
  <h2>Classic Workflows (Legacy)</h2>
  <div class="empty-state">No classic workflows found</div>
</section>`;
    }

    // Group by mode
    const asyncWorkflows = workflows.filter(wf => wf.mode === 0 || wf.modeName === 'Background');
    const realtimeWorkflows = workflows.filter(wf => wf.mode === 1 || wf.modeName === 'RealTime');

    const rows = workflows.map(workflow => {
      const entityDisplay = workflow.entityDisplayName || workflow.entity;
      const complexity = workflow.migrationRecommendation?.complexity || 'Unknown';

      return `<tr>
  <td>${this.escapeHtml(workflow.name)}</td>
  <td>${this.escapeHtml(entityDisplay)}</td>
  <td><span class="badge badge-${workflow.state === 'Active' ? 'success' : workflow.state === 'Draft' ? 'warning' : 'error'}">${workflow.state}</span></td>
  <td>${this.escapeHtml(workflow.modeName)}</td>
  <td><span class="badge badge-${complexity === 'Critical' ? 'error' : complexity === 'High' ? 'warning' : 'info'}">${complexity}</span></td>
</tr>`;
    }).join('\n');

    // Build advisory section
    let advisorySection = '';
    if (asyncWorkflows.length > 0) {
      advisorySection += `
  <div class="alert alert-info">
    <strong>${this.alertIcon('info')} Info &mdash; Async Workflows (${asyncWorkflows.length}):</strong> These async workflows can be migrated to Power Automate cloud flows. Classic workflows are legacy technology. Microsoft recommends migrating to Power Automate for continued support and access to modern features.
  </div>`;
    }
    if (realtimeWorkflows.length > 0) {
      advisorySection += `
  <div class="alert alert-warning">
    <strong>${this.alertIcon('warning')} Warning &mdash; Real-time Workflows (${realtimeWorkflows.length}):</strong> Real-time workflows cannot be fully migrated to Power Automate cloud flows due to their synchronous nature. Consider using Dataverse plugins for synchronous business logic, or migrate to Power Automate with the understanding that flows are asynchronous and cannot block user operations.
  </div>`;
    }

    return `<section id="classic-workflows" class="content-section">
  <h2>Classic Workflows - Migration Recommended (${workflows.length})</h2>
  <div class="alert alert-warning">
    <strong>${this.alertIcon('warning')} Warning &mdash; Legacy Technology:</strong> Classic workflows are legacy technology. Microsoft recommends creating new automation with Power Automate and migrating existing workflows. <a href="https://learn.microsoft.com/en-us/power-automate/replace-workflows-with-flows" target="_blank" rel="noopener noreferrer">Learn more</a>
  </div>
  ${advisorySection}
  <div class="table-container">
    <table class="data-table sortable" id="classic-workflows-table">
      <thead>
        <tr>
          <th onclick="sortTable('classic-workflows-table', 0)">Name <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 2)">State <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 3)">Mode <span class="sort-indicator"></span></th>
          <th onclick="sortTable('classic-workflows-table', 4)">Complexity <span class="sort-indicator"></span></th>
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
    <strong>${this.alertIcon('info')} Note:</strong> External API calls can introduce security risks and performance concerns. Review each endpoint carefully.
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
  htmlCrossEntitySection(analysis: CrossEntityAnalysisResult | undefined): string {
    const coverageNotice = `<div class="alert alert-info" style="margin-bottom: 16px;">
      <strong>Detection Coverage:</strong> Cross-entity traces are detected from Power Automate flow definitions (JSON) and Classic Workflow XAML.
      Plugin decompilation is not included — plugins are shown with firing-status analysis based on filtering attributes.
    </div>`;

    if (!analysis || analysis.totalEntryPoints === 0) {
      return `<section id="cross-entity" class="content-section">
  <h2 style="display:flex;align-items:center;gap:10px;">${this.navIcon('cross-entity')} Cross-Entity Automation</h2>
  ${coverageNotice}
  <p>No cross-entity automation entry points detected in this solution scope.</p>
</section>`;
    }

    // Stats
    const statsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
      <div class="stats-card"><div class="stats-value">${analysis.totalEntryPoints}</div><div class="stats-label">Entry Points</div></div>
      <div class="stats-card"><div class="stats-value">${analysis.entityViews.size}</div><div class="stats-label">Target Entities</div></div>
      <div class="stats-card"><div class="stats-value">${analysis.totalBranches}</div><div class="stats-label">Downstream Branches</div></div>
      <div class="stats-card"><div class="stats-value" style="color:#d32f2f">${analysis.risks.filter(r => r.severity === 'High').length}</div><div class="stats-label">High Risks</div></div>
    </div>`;

    // Risks
    const risksHtml = analysis.risks.length > 0 ? `
      <h3>Performance &amp; Risk Warnings</h3>
      ${analysis.risks.map(r => `
        <div style="padding:10px;border-left:4px solid ${r.severity === 'High' ? '#d32f2f' : '#f57c00'};background:${r.severity === 'High' ? '#ffebee' : '#fff8e1'};border-radius:4px;margin-bottom:8px;">
          <strong>${this.htmlEscape(r.type)}</strong> (${r.severity}) ${r.automationName ? `— ${this.htmlEscape(r.automationName)}` : ''}<br/>
          <span>${this.htmlEscape(r.description)}</span>
        </div>`).join('')}` : '';

    // Chain links table rows
    const chainRows = analysis.chainLinks.map(l => `<tr>
      <td>${this.htmlEscape(l.sourceEntityDisplayName)}<br/><small style="font-family:monospace;color:#666">${this.htmlEscape(l.sourceEntity)}</small></td>
      <td>${this.htmlEscape(l.automationName)}<br/><span class="badge badge-${l.automationType === 'Flow' ? 'success' : 'warning'}">${this.htmlEscape(l.automationType)}</span></td>
      <td>→</td>
      <td>${this.htmlEscape(l.targetEntityDisplayName)}<br/><small style="font-family:monospace;color:#666">${this.htmlEscape(l.targetEntity)}</small></td>
      <td><span class="badge badge-${l.operation === 'Create' ? 'success' : l.operation === 'Delete' ? 'danger' : 'warning'}">${this.htmlEscape(l.operation)}</span></td>
      <td><span class="badge badge-${l.isAsynchronous ? 'success' : 'warning'}">${l.isAsynchronous ? 'Async' : 'Sync'}</span></td>
    </tr>`).join('');

    return `<section id="cross-entity" class="content-section">
  <h2 style="display:flex;align-items:center;gap:10px;">${this.navIcon('cross-entity')} Cross-Entity Automation</h2>
  ${coverageNotice}
  ${statsHtml}
  ${risksHtml}
  <h3>Chain Links</h3>
  <div class="table-container">
    <table class="data-table sortable" id="cross-entity-table">
      <thead>
        <tr>
          <th onclick="sortTable('cross-entity-table', 0)">Source Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('cross-entity-table', 1)">Automation <span class="sort-indicator"></span></th>
          <th></th>
          <th onclick="sortTable('cross-entity-table', 3)">Target Entity <span class="sort-indicator"></span></th>
          <th onclick="sortTable('cross-entity-table', 4)">Operation <span class="sort-indicator"></span></th>
          <th>Mode</th>
        </tr>
      </thead>
      <tbody>
        ${chainRows}
      </tbody>
    </table>
  </div>
  <p style="margin-top: 16px; color: #666; font-style: italic;">Note: Synchronous cross-entity operations may impact performance</p>

  <h3>Pipeline Traces</h3>
  <p style="color:#666;margin-bottom:12px;">Per-entity activation analysis — which automations fire (or don't) when an external source writes to the entity.</p>
  ${this.htmlPipelineTraces(analysis)}
</section>`;
  }

  /**
   * Render pipeline trace accordions for all entity views
   */
  private htmlPipelineTraces(analysis: CrossEntityAnalysisResult): string {
    if (analysis.entityViews.size === 0) return '<p>No pipeline traces available.</p>';

    const firingBadge = (status: string): string => {
      if (status === 'WillFire') return '<span class="badge badge-success">Yes</span>';
      if (status === 'WontFire') return '<span class="badge badge-danger">No (field mismatch)</span>';
      return '<span class="badge badge-warning">Yes (no filter)</span>';
    };

    const items: string[] = [];
    let idx = 0;
    for (const [, view] of analysis.entityViews) {
      const id = `cea-entity-${idx++}`;
      const traceBlocks = view.traces.map((trace, ti) => {
        const { entryPoint, activations, risks } = trace;
        const tid = `${id}-trace-${ti}`;

        const actRows = activations.map(act => {
          const ds = act.downstream
            ? `→ <strong>${this.htmlEscape(act.downstream.targetEntityDisplayName)}</strong> (${this.htmlEscape(act.downstream.operation)})`
            : '';
          return `<tr>
            <td>${this.htmlEscape(act.automationName)}</td>
            <td><span class="badge badge-${act.automationType === 'Plugin' ? 'warning' : 'success'}">${this.htmlEscape(act.automationType)}</span></td>
            <td>${this.htmlEscape(act.stageName ?? '—')}</td>
            <td>${this.htmlEscape(act.mode)}</td>
            <td>${firingBadge(act.firingStatus)}</td>
            <td style="font-family:monospace;font-size:0.8em">${act.matchedFields.length > 0 ? this.htmlEscape(act.matchedFields.join(', ')) : '—'}</td>
            <td>${ds}</td>
          </tr>`;
        }).join('');

        const riskHtml = risks.length > 0
          ? risks.map(r => `<div style="padding:6px 10px;border-left:3px solid ${r.severity === 'High' ? '#d32f2f' : '#f57c00'};background:${r.severity === 'High' ? '#ffebee' : '#fff8e1'};border-radius:3px;margin-bottom:6px;font-size:0.85em"><strong>${this.htmlEscape(r.type)}</strong>: ${this.htmlEscape(r.description)}</div>`).join('')
          : '';

        const modeLabel = entryPoint.isAsynchronous ? 'Async' : 'Sync';
        const header = `${this.htmlEscape(entryPoint.automationName)} <span style="font-weight:normal;color:#666">(${this.htmlEscape(entryPoint.automationType)} — ${this.htmlEscape(entryPoint.operation)} from ${this.htmlEscape(entryPoint.sourceEntityDisplayName)} — ${modeLabel})</span>`;

        return `<div class="accordion-item" style="margin-bottom:8px;">
  <div class="accordion-header" onclick="toggleAccordion('${tid}')" style="font-size:0.9em;">
    <span class="accordion-icon" id="icon-${tid}">+</span>
    <span>${header}</span>
    <span class="badge badge-${entryPoint.confidence === 'High' ? 'success' : entryPoint.confidence === 'Medium' ? 'warning' : 'danger'}" style="margin-left:auto">${this.htmlEscape(entryPoint.confidence)} confidence</span>
  </div>
  <div class="accordion-content" id="${tid}" style="display:none;padding:12px;">
    ${riskHtml}
    <table class="data-table" style="font-size:0.85em;">
      <thead><tr>
        <th>Automation</th><th>Type</th><th>Stage</th><th>Mode</th><th>Fires?</th><th>Matched Fields</th><th>Downstream</th>
      </tr></thead>
      <tbody>${actRows}</tbody>
    </table>
    ${entryPoint.fields.length > 0 ? `<p style="margin-top:8px;font-size:0.8em;color:#666"><strong>Fields set by source:</strong> <code>${this.htmlEscape(entryPoint.fields.join(', '))}</code></p>` : ''}
  </div>
</div>`;
      }).join('');

      items.push(`<div class="accordion-item">
  <div class="accordion-header" onclick="toggleAccordion('${id}')">
    <span class="accordion-icon" id="icon-${id}">+</span>
    <h4 style="margin:0">${this.htmlEscape(view.entityDisplayName)}</h4>
    <span style="margin-left:auto;font-size:0.85em;color:#666">${view.traces.length} ${view.traces.length === 1 ? 'entry point' : 'entry points'}</span>
  </div>
  <div class="accordion-content" id="${id}" style="display:none;padding:12px 16px;">
    <div class="accordion">${traceBlocks}</div>
  </div>
</div>`);
    }

    return `<div class="accordion">${items.join('\n')}</div>`;
  }

  /**
   * HTML-escape a string to prevent XSS
   */
  private htmlEscape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
   * Returns a small inline SVG icon string for use in navigation and headings.
   * All icons use currentColor so they inherit the surrounding text colour.
   */
  private navIcon(key: string): string {
    const base = `width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"`;
    const fill = `width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink:0"`;
    const icons: Record<string, string> = {
      summary:   `<svg ${fill}><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`,
      erd:       `<svg ${base}><rect x="5.5" y="1" width="5" height="3.5" rx="0.75" fill="currentColor" stroke="none"/><rect x="1" y="11.5" width="5" height="3.5" rx="0.75" fill="currentColor" stroke="none"/><rect x="10" y="11.5" width="5" height="3.5" rx="0.75" fill="currentColor" stroke="none"/><line x1="8" y1="4.5" x2="8" y2="7.5"/><line x1="8" y1="7.5" x2="3.5" y2="11.5"/><line x1="8" y1="7.5" x2="12.5" y2="11.5"/></svg>`,
      entities:  `<svg ${base}><rect x="1" y="2" width="14" height="12" rx="1.5"/><line x1="1" y1="6" x2="15" y2="6"/><line x1="1" y1="10" x2="15" y2="10"/></svg>`,
      plugins:   `<svg ${base}><path d="M5 1.5C3.5 1.5 3 2.5 3 3.5V7c0 .8-1 1-1.5 1C2 8 3 8.2 3 9v3.5C3 13.5 3.5 14.5 5 14.5"/><path d="M11 1.5C12.5 1.5 13 2.5 13 3.5V7c0 .8 1 1 1.5 1C14 8 13 8.2 13 9v3.5C13 13.5 12.5 14.5 11 14.5"/><line x1="6" y1="6" x2="10" y2="10"/><line x1="10" y1="6" x2="6" y2="10"/></svg>`,
      flows:     `<svg ${fill}><path d="M9.5 1.5L4 9.5h4.5L7 14.5l6-7H8z"/></svg>`,
      'business-rules': `<svg ${base}><rect x="3" y="2" width="10" height="12.5" rx="1.5"/><line x1="5.5" y1="6" x2="10.5" y2="6"/><line x1="5.5" y1="9" x2="8.5" y2="9"/><line x1="5.5" y1="12" x2="9" y2="12"/></svg>`,
      'classic-workflows': `<svg ${base}><path d="M13.5 8a5.5 5.5 0 1 1-1.4-3.7"/><polyline points="14,1 14,5 10,5"/></svg>`,
      'business-process-flows': `<svg ${base} stroke-linejoin="round"><polygon points="8,1.5 14.5,8 8,14.5 1.5,8"/></svg>`,
      'web-resources': `<svg ${base}><circle cx="8" cy="8" r="6.5"/><path d="M8 1.5c-1.8 0-3.5 2.9-3.5 6.5s1.7 6.5 3.5 6.5 3.5-2.9 3.5-6.5-1.7-6.5-3.5-6.5z"/><line x1="1.5" y1="8" x2="14.5" y2="8"/></svg>`,
      'custom-apis': `<svg ${base}><path d="M3 5.5h10M3 5.5l2.5-2.5M3 5.5l2.5 2.5"/><path d="M13 10.5H3M13 10.5l-2.5-2.5M13 10.5l-2.5 2.5"/></svg>`,
      'environment-variables': `<svg ${base}><rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/><line x1="4" y1="5" x2="9" y2="5"/><line x1="4" y1="8" x2="7" y2="8"/><line x1="4" y1="11" x2="8" y2="11"/><circle cx="12" cy="9.5" r="2" fill="currentColor" stroke="none"/><line x1="10.5" y1="9.5" x2="13.5" y2="9.5"/><line x1="12" y1="8" x2="12" y2="11"/></svg>`,
      'connection-references': `<svg ${base}><path d="M6.5 9.5a3.5 3.5 0 0 0 4.95 0l2-2a3.5 3.5 0 0 0-4.95-4.95L7.6 3.45"/><path d="M9.5 6.5a3.5 3.5 0 0 0-4.95 0l-2 2a3.5 3.5 0 0 0 4.95 4.95l.9-.9"/></svg>`,
      security:  `<svg ${base}><rect x="2.5" y="7" width="11" height="8" rx="1.5"/><path d="M5 7V5.5a3 3 0 0 1 6 0V7"/></svg>`,
      'external-dependencies': `<svg ${base}><path d="M6.5 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5"/><polyline points="10,1.5 14.5,1.5 14.5,6"/><line x1="7.5" y1="8.5" x2="14.5" y2="1.5"/></svg>`,
      'cross-entity': `<svg ${base}><rect x="1" y="1" width="6" height="4" rx="1"/><rect x="9" y="11" width="6" height="4" rx="1"/><path d="M4 5v3a3 3 0 0 0 3 3h2"/><polyline points="12,11 12,9 10,9"/></svg>`,
      print:     `<svg ${base}><path d="M4 6V3h8v3"/><rect x="1" y="6" width="14" height="6" rx="1"/><path d="M4 9v5h8V9"/></svg>`,
    };
    return icons[key] ?? '';
  }

  /**
   * Returns a small inline SVG icon for alert boxes (info or warning).
   * Uses explicit colours so it stands out on the light alert background.
   */
  private alertIcon(type: 'info' | 'warning'): string {
    if (type === 'info') {
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><circle cx="8" cy="8" r="7.5" fill="#0078d4"/><rect x="7.1" y="7" width="1.8" height="5.5" rx="0.9" fill="white"/><circle cx="8" cy="4.5" r="1.1" fill="white"/></svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><path d="M8 1.5L1 14.5h14z" fill="#ffb900"/><rect x="7.1" y="7" width="1.8" height="4.5" rx="0.9" fill="white"/><circle cx="8" cy="13" r="0.9" fill="white"/></svg>`;
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
      display: flex;
      align-items: center;
      gap: 8px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
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
      width: calc(100% - 250px);
      max-width: 1800px;
      box-sizing: border-box;
    }

    @media (min-width: 2170px) {
      main {
        max-width: 2200px;
      }
    }

    @media (min-width: 4090px) {
      main {
        max-width: 3200px;
      }
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
      display: flex;
      align-items: center;
      gap: 6px;
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
    return `    // HTML-escape helper — used for all data inserted into tooltip innerHTML.
    var _esc = function(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };

    // Read ERD graph data from the embedded JSON data-block.
    // Using <script type="application/json"> avoids all JS-parsing risks from
    // special characters in entity names / labels.
    var _erdDataEl = document.getElementById('erd-data');
    var ERD_GRAPH_DATA = _erdDataEl ? JSON.parse(_erdDataEl.textContent || 'null') : null;

    // Trigger Mermaid rendering manually (startOnLoad: false was set in <head>)
    if (typeof mermaid !== 'undefined') {
      mermaid.run();
    }

    // ── Cytoscape ERD interactive graph ─────────────────────────────────────
    var _cy = null;
    var _selectedNodeId = null;
    var _isolateHops = 1;

    if (typeof cytoscape !== 'undefined' && ERD_GRAPH_DATA && ERD_GRAPH_DATA.nodes) {
      var stylesheet = [
        { selector: 'node', style: {
            'background-color': 'data(color)', 'border-color': 'data(strokeColor)', 'border-width': 2,
            'color': 'data(textColor)', 'label': 'data(label)', 'text-valign': 'center', 'text-halign': 'center',
            'font-size': '10px', 'font-weight': 'bold', 'width': '120px', 'height': '36px',
            'shape': 'round-rectangle', 'text-wrap': 'ellipsis', 'text-max-width': '110px'
        }},
        { selector: 'node.highlighted', style: { 'border-width': 3, 'border-color': '#0078d4', 'z-index': 10 } },
        { selector: 'node.faded', style: { 'opacity': 0.15 } },
        { selector: 'node.isolated-hidden', style: { 'display': 'none' } },
        { selector: 'edge', style: {
            'width': 1.5, 'line-color': '#aaa', 'target-arrow-color': '#aaa', 'target-arrow-shape': 'triangle',
            'curve-style': 'bezier', 'label': '', 'font-size': '8px', 'color': '#666',
            'text-background-color': '#fff', 'text-background-opacity': 0.85, 'text-background-padding': '2px',
            'text-max-width': '80px', 'text-wrap': 'ellipsis'
        }},
        { selector: 'edge[type = "N-N"]', style: {
            'line-style': 'dashed', 'source-arrow-shape': 'triangle', 'source-arrow-color': '#aaa'
        }},
        { selector: 'edge.hovered', style: { 'width': 3, 'line-color': '#0078d4', 'target-arrow-color': '#0078d4', 'source-arrow-color': '#0078d4', 'z-index': 10 } },
        { selector: 'edge.faded', style: { 'opacity': 0.08 } },
        { selector: 'edge.isolated-hidden', style: { 'display': 'none' } }
      ];

      var elements = {
        nodes: ERD_GRAPH_DATA.nodes.map(function(n) { return { data: n }; }),
        edges: ERD_GRAPH_DATA.edges.map(function(e) { return { data: e }; })
      };

      _cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: stylesheet,
        layout: { name: 'cose', animate: false, nodeRepulsion: function() { return 8000000; }, idealEdgeLength: function() { return 180; }, nodeOverlap: 60, gravity: 0.15, numIter: 1000 },
        minZoom: 0.05, maxZoom: 4, wheelSensitivity: 0.3
      });
      _cy.fit(undefined, 40);

      // ── Node click — select
      _cy.on('tap', 'node', function(evt) {
        var n = evt.target;
        _selectedNodeId = n.data('id');
        var isolateBtn = document.getElementById('isolateBtn');
        if (isolateBtn) isolateBtn.disabled = false;
        var tip = _getOrCreateTip();
        var pub = n.data('publisherPrefix') ? '<br><span style="color:#666">Publisher: ' + _esc(n.data('publisherPrefix')) + '</span>' : '';
        var cnt = _cy.getElementById(n.data('id')).neighborhood('node').length;
        tip.innerHTML = '<strong>' + _esc(n.data('label')) + '</strong><br><span style="color:#888;font-size:11px;">' + _esc(n.data('id')) + '</span>' + pub + '<br><span style="color:#666">Relationships: ' + cnt + '</span>';
        tip.style.left = (evt.originalEvent.clientX + 12) + 'px';
        tip.style.top = (evt.originalEvent.clientY + 12) + 'px';
        tip.style.display = 'block';
      });

      // ── Background click — clear selection
      _cy.on('tap', function(evt) {
        if (evt.target === _cy) {
          _selectedNodeId = null;
          var isolateBtn = document.getElementById('isolateBtn');
          if (isolateBtn) isolateBtn.disabled = true;
          var tip = document.getElementById('erd-tip');
          if (tip) tip.style.display = 'none';
          _cy.nodes().removeClass('highlighted faded');
          _cy.edges().removeClass('faded');
        }
      });

      // ── Node hover — tooltip
      _cy.on('mouseover', 'node', function(evt) {
        var n = evt.target;
        var tip = _getOrCreateTip();
        var connected = n.neighborhood('node').length;
        var content = '<strong style="word-break:break-all">' + _esc(n.data('label')) + '</strong>';
        content += '<br><span style="color:#888;font-size:11px;word-break:break-all">Logical name: ' + _esc(n.data('id')) + '</span>';
        if (n.data('publisherPrefix')) {
          content += '<br><span style="color:#888;font-size:11px;">Publisher: ' + _esc(n.data('publisherPrefix')) + '</span>';
        }
        content += '<br><span style="color:#888;font-size:11px;">Relationships: ' + connected + '</span>';
        tip.innerHTML = content;
        tip.style.left = (evt.originalEvent.clientX + 12) + 'px';
        tip.style.top = (evt.originalEvent.clientY + 12) + 'px';
        tip.style.display = 'block';
      });

      _cy.on('mousemove', 'node', function(evt) {
        var tip = document.getElementById('erd-tip');
        if (tip) { tip.style.left = (evt.originalEvent.clientX + 12) + 'px'; tip.style.top = (evt.originalEvent.clientY + 12) + 'px'; }
      });

      _cy.on('mouseout', 'node', function() {
        var tip = document.getElementById('erd-tip');
        if (tip) tip.style.display = 'none';
      });

      // ── Edge hover — tooltip
      _cy.on('mouseover', 'edge', function(evt) {
        var e = evt.target;
        e.addClass('hovered');
        var tip = _getOrCreateTip();
        var type = e.data('type');
        var content = '<strong style="word-break:break-all">' + _esc(e.data('id')) + '</strong>';
        content += '<br><span style="color:#888;font-size:11px;">' + (type === 'N-N' ? 'N:N relationship' : '1:N relationship') + '</span>';
        if (type === '1-N') {
          var refAttr = e.data('referencedAttribute'); var relAttr = e.data('label');
          content += '<br><span style="color:#555;word-break:break-all">' + _esc(e.data('source')) + '.' + _esc(refAttr || '') + ' &rarr; ' + _esc(e.data('target')) + '.' + _esc(relAttr || '') + '</span>';
        } else if (type === 'N-N' && e.data('intersectEntityName')) {
          content += '<br><span style="color:#555">Via: ' + _esc(e.data('intersectEntityName')) + '</span>';
        }
        tip.innerHTML = content;
        tip.style.left = (evt.originalEvent.clientX + 12) + 'px';
        tip.style.top = (evt.originalEvent.clientY + 12) + 'px';
        tip.style.display = 'block';
      });

      _cy.on('mousemove', 'edge', function(evt) {
        var tip = document.getElementById('erd-tip');
        if (tip) { tip.style.left = (evt.originalEvent.clientX + 12) + 'px'; tip.style.top = (evt.originalEvent.clientY + 12) + 'px'; }
      });

      _cy.on('mouseout', 'edge', function(evt) {
        evt.target.removeClass('hovered');
        var tip = document.getElementById('erd-tip');
        if (tip) tip.style.display = 'none';
      });
    }

    function _getOrCreateTip() {
      var tip = document.getElementById('erd-tip');
      if (!tip) {
        tip = document.createElement('div');
        tip.id = 'erd-tip';
        tip.style.cssText = 'position:fixed;background:#fff;border:1px solid #ccc;border-radius:6px;padding:8px 12px;font-size:12px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:9999;max-width:280px;pointer-events:none;line-height:1.5;';
        document.body.appendChild(tip);
      }
      return tip;
    }

    function erdLayout(name) {
      if (!_cy) return;
      var opts = {
        cose: { name: 'cose', animate: false, nodeRepulsion: function() { return 8000000; }, idealEdgeLength: function() { return 180; }, nodeOverlap: 60, gravity: 0.15, numIter: 1000 },
        breadthfirst: { name: 'breadthfirst', animate: false, directed: true, padding: 60, spacingFactor: 2.0 }
      };
      var layout = _cy.layout(opts[name] || opts.cose);
      layout.on('layoutstop', function() { _cy.fit(undefined, 40); });
      layout.run();
    }

    function erdFit() { if (_cy) _cy.fit(undefined, 40); }

    function erdSearch(q) {
      if (!_cy) return;
      _cy.nodes().removeClass('highlighted faded');
      _cy.edges().removeClass('faded');
      if (!q) return;
      var lq = q.toLowerCase();
      _cy.nodes().forEach(function(n) {
        var match = n.data('label').toLowerCase().indexOf(lq) >= 0 || n.data('id').toLowerCase().indexOf(lq) >= 0;
        n.addClass(match ? 'highlighted' : 'faded');
      });
      _cy.edges().addClass('faded');
    }

    function erdSetHops(h) {
      _isolateHops = h;
      ['hop1Btn','hop2Btn','hop3Btn'].forEach(function(id, i) {
        var btn = document.getElementById(id);
        if (btn) btn.style.fontWeight = (i + 1 === h) ? 'bold' : 'normal';
      });
    }

    function erdIsolate() {
      if (!_cy || !_selectedNodeId) return;
      var node = _cy.getElementById(_selectedNodeId);
      var collected = node;
      var frontier = node;
      for (var i = 0; i < _isolateHops; i++) {
        var next = frontier.neighborhood();
        collected = collected.union(next);
        frontier = next;
      }
      _cy.elements().addClass('isolated-hidden');
      collected.removeClass('isolated-hidden');
      _cy.fit(collected, 60);
      var btn = document.getElementById('clearIsolateBtn');
      if (btn) btn.style.display = '';
    }

    function erdClearIsolate() {
      if (!_cy) return;
      _cy.elements().removeClass('isolated-hidden');
      _cy.fit(undefined, 40);
      var btn = document.getElementById('clearIsolateBtn');
      if (btn) btn.style.display = 'none';
    }

    function downloadErdPng() {
      if (!_cy) return;
      var png = _cy.png({ full: true, scale: 2, bg: '#fafafa' });
      var a = document.createElement('a'); a.href = png; a.download = 'erd.png'; a.click();
    }

    function downloadErdSvg() {
      if (!_cy) return;
      var ext = _cy.elements(':visible').boundingBox({ includeLabels: false });
      if (!ext || !isFinite(ext.x1)) return;
      var pad = 50, W = Math.ceil(ext.x2 - ext.x1 + pad * 2), H = Math.ceil(ext.y2 - ext.y1 + pad * 2);
      var ox = -ext.x1 + pad, oy = -ext.y1 + pad;
      var esc = function(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
      var parts = ['<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">',
        '<defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#aaa"/></marker></defs>',
        '<rect width="'+W+'" height="'+H+'" fill="#fafafa"/>'];
      _cy.edges(':visible').forEach(function(e) {
        var s = _cy.getElementById(e.data('source')), t = _cy.getElementById(e.data('target'));
        if (s.empty() || t.empty()) return;
        var dash = e.data('type') === 'N-N' ? ' stroke-dasharray="6,3"' : '';
        parts.push('<line x1="'+(s.position().x+ox).toFixed(1)+'" y1="'+(s.position().y+oy).toFixed(1)+'" x2="'+(t.position().x+ox).toFixed(1)+'" y2="'+(t.position().y+oy).toFixed(1)+'" stroke="#aaa" stroke-width="1.5" marker-end="url(#arr)"'+dash+'/>');
      });
      _cy.nodes(':visible').forEach(function(n) {
        var p = n.position(), w = n.width(), h = n.height();
        var x = (p.x+ox-w/2).toFixed(1), y = (p.y+oy-h/2).toFixed(1);
        parts.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+n.data('color')+'" stroke="'+n.data('strokeColor')+'" stroke-width="2"/>');
        parts.push('<text x="'+(p.x+ox).toFixed(1)+'" y="'+(p.y+oy+4).toFixed(1)+'" text-anchor="middle" fill="'+n.data('textColor')+'" font-size="10" font-weight="bold" font-family="system-ui,sans-serif">'+esc(n.data('label'))+'</text>');
      });
      parts.push('</svg>');
      var blob = new Blob([parts.join('\\n')], { type: 'image/svg+xml' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'erd.svg'; a.click();
      URL.revokeObjectURL(url);
    }
    // ── End Cytoscape ERD ──────────────────────────────────────────────────

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
        <h2 class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('security')} Security</h2>
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
            <th>Masking Rule</th>
            <th>Managed</th>
          </tr>
        </thead>
        <tbody>`;

    for (const rule of attributeMaskingRules) {
      html += `
          <tr>
            <td><strong>${this.escapeHtml(rule.entitylogicalname)}</strong></td>
            <td>${this.escapeHtml(rule.attributelogicalname)}</td>
            <td><span class="badge">${this.escapeHtml(rule.maskingRuleName)}</span></td>
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
        <h4>Field Security (${fieldSecurity.securedFields.length} secured field${fieldSecurity.securedFields.length > 1 ? 's' : ''})</h4>
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
