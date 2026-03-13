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
  SolutionDistribution,
  AttributeMetadata,
  OneToManyRelationship,
  ManyToOneRelationship,
  ManyToManyRelationship,
} from '../../types/blueprint.js';
import type { PrivilegeDetail } from '../../discovery/SecurityRoleDiscovery.js';
import type { CrossEntityAnalysisResult } from '../../types/crossEntityTrace.js';
import type { ClassicWorkflow } from '../../types/classicWorkflow.js';
import type { CustomAPI } from '../../types/customApi.js';
import type { EnvironmentVariable } from '../../types/environmentVariable.js';
import type { ConnectionReference } from '../../types/connectionReference.js';
import type { BusinessProcessFlow } from '../../types/businessProcessFlow.js';
import type { GlobalChoice } from '../../types/globalChoice.js';
import type { CustomConnector } from '../../types/customConnector.js';
import type { CanvasApp } from '../../types/canvasApp.js';
import type { CustomPage } from '../../types/customPage.js';
import type { ModelDrivenApp } from '../../types/modelDrivenApp.js';

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
  <title>${this.htmlEscape(title)}</title>
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
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
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
    return `<nav class="sidebar" id="sidebar" role="navigation" aria-label="Blueprint sections">
  <div class="sidebar-header">
    <h3>Blueprint</h3>
    <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">☰</button>
  </div>
  <ul class="nav-links">
    <li><a href="#summary">${this.navIcon('summary')} Summary</a></li>
    <li><a href="#solutions">${this.navIcon('solutions')} Solutions</a></li>
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
    <li><a href="#global-choices">${this.navIcon('global-choices')} Global Choices</a></li>
    <li><a href="#custom-connectors">${this.navIcon('custom-connectors')} Custom Connectors</a></li>
    <li><a href="#canvas-apps">${this.navIcon('canvas-apps')} Canvas Apps</a></li>
    <li><a href="#custom-pages">${this.navIcon('custom-pages')} Custom Pages</a></li>
    <li><a href="#model-driven-apps">${this.navIcon('model-driven-apps')} Model-Driven Apps</a></li>
    <li><a href="#security">${this.navIcon('security')} Security</a></li>
    <li><a href="#external-dependencies">${this.navIcon('external-dependencies')} External Dependencies</a></li>
    <li><a href="#cross-entity">${this.navIcon('cross-entity')} Cross-Entity Automation <span class="badge badge-warning" style="font-size:0.7em;vertical-align:middle;">Preview</span></a></li>
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
    return `<header class="report-header" role="banner">
  <h1>Power Platform Solution Blueprint</h1>
  <div class="metadata-item" style="display:flex;flex-direction:column;gap:4px;">
    <div><span class="metadata-label">Environment:</span> <span class="metadata-value">${this.htmlEscape(metadata.environment)}</span></div>
    <div><span class="metadata-label">Generated:</span> <span class="metadata-value">${this.htmlEscape(generatedDate)}</span></div>
  </div>
</header>`;
  }

  /**
   * Generate ERD section
   * Note: Only includes the first diagram (comprehensive view) to match the tool UI behavior
   */
  htmlErdSection(erd: ERDDefinition | undefined): string {
    if (!erd || erd.diagrams.length === 0) {
      return `<section id="erd" class="content-section" aria-labelledby="heading-erd">
  <h2 id="heading-erd">Entity Relationship Diagram</h2>
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

      return `<section id="erd" class="content-section" aria-labelledby="heading-erd">
  <h2 id="heading-erd">Entity Relationship Diagram</h2>
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
  <h3>${this.htmlEscape(diagram.title)}</h3>
  <p class="diagram-description">${this.htmlEscape(diagram.description)}</p>
  <div class="mermaid" id="diagram-0">
${diagram.mermaidDiagram}
  </div>
  <!--
    Note: mermaidDiagram content is NOT htmlEscape()d here — Mermaid reads the raw
    text content of this div and would fail to parse HTML entities. This is safe because:
    (1) entity logical names are validated to /^[a-z][a-z0-9_]*$/ before any OData query,
        so they cannot contain HTML-breaking characters.
    (2) entity display names are enclosed in Mermaid double-quoted labels ["…"],
        where < > & are treated as Mermaid text and cannot break out of the outer <div>.
  -->
  <p class="diagram-stats">Entities: ${diagram.entityCount} | Relationships: ${diagram.relationshipCount}</p>
</div>`;

    return `<section id="erd" class="content-section" aria-labelledby="heading-erd">
  <h2 id="heading-erd">Entity Relationship Diagram</h2>
  ${legendHtml}
  ${diagramHtml}
</section>`;
  }

  /**
   * Generate legend HTML for ERD
   */
  private generateLegendHtml(legend: { color: string; publisherName: string; entityCount: number }[]): string {
    if (!legend || legend.length === 0) return '';

    const sanitizeColor = (c: string): string =>
      /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#888888';

    const items = legend.map(item => {
      return `<div class="legend-item">
  <span class="legend-color" style="background-color: ${sanitizeColor(item.color)}"></span>
  <span class="legend-label">${this.htmlEscape(item.publisherName)} (${item.entityCount})</span>
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
    return `<section id="summary" class="content-section" role="region" aria-label="Blueprint summary" aria-labelledby="heading-summary">
  <h2 id="heading-summary">Summary</h2>
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
      <div class="card-number">${summary.totalPluginPackages}</div>
      <div class="card-label">Plugin Packages</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalFlows}</div>
      <div class="card-label">Flows</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalBusinessRules}</div>
      <div class="card-label">Business Rules</div>
    </div>
    <div class="summary-card ${summary.totalClassicWorkflows > 0 ? 'card-warning' : ''}">
      <div class="card-number">${summary.totalClassicWorkflows}</div>
      <div class="card-label">Classic Workflows</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalBusinessProcessFlows}</div>
      <div class="card-label">Business Process Flows</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalCustomAPIs}</div>
      <div class="card-label">Custom APIs</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalEnvironmentVariables}</div>
      <div class="card-label">Environment Variables</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalConnectionReferences}</div>
      <div class="card-label">Connection References</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalGlobalChoices}</div>
      <div class="card-label">Global Choices</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalCustomConnectors}</div>
      <div class="card-label">Custom Connectors</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalWebResources}</div>
      <div class="card-label">Web Resources</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalCustomPages}</div>
      <div class="card-label">Custom Pages</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalSecurityRoles}</div>
      <div class="card-label">Security Roles</div>
    </div>
    <div class="summary-card">
      <div class="card-number">${summary.totalFieldSecurityProfiles}</div>
      <div class="card-label">Field Security Profiles</div>
    </div>
  </div>
</section>`;
  }

  /**
   * Generate entities accordion section
   */
  htmlEntitiesAccordion(entities: EntityBlueprint[]): string {
    if (entities.length === 0) {
      return `<section id="entities" class="content-section" aria-labelledby="heading-entities">
  <h2 id="heading-entities">Entities</h2>
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
  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="entity-${index}" onclick="toggleAccordion('entity-${index}')" onkeydown="accordionKeydown(event,'entity-${index}')">
    <span class="accordion-icon" id="icon-entity-${index}">+</span>
    <h3>${this.htmlEscape(displayName)}</h3>
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

    return `<section id="entities" class="content-section" aria-labelledby="heading-entities">
  <h2 id="heading-entities">Entities (${entities.length})</h2>
  <div class="accordion">
${accordionItems}
  </div>
</section>`;
  }

  /**
   * Generate attributes table for entity detail
   */
  private generateAttributesTable(attributes: AttributeMetadata[]): string {
    if (attributes.length === 0) return '';

    const rows = attributes.slice(0, 50).map(attr => {
      const displayName = attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName;
      const description = attr.Description?.UserLocalizedLabel?.Label || '';
      const required = attr.RequiredLevel?.Value || 'None';
      const type = attr.AttributeType || 'Unknown';

      return `<tr>
  <td>${this.htmlEscape(attr.LogicalName)}</td>
  <td>${this.htmlEscape(displayName)}</td>
  <td>${this.htmlEscape(type)}</td>
  <td><span class="badge badge-${required === 'SystemRequired' ? 'error' : required === 'ApplicationRequired' ? 'warning' : 'info'}">${this.htmlEscape(required)}</span></td>
  <td style="word-break: break-word;">${this.htmlEscape(description)}</td>
</tr>`;
    }).join('\n');

    const moreText = attributes.length > 50 ? `<p class="table-note">Showing 50 of ${attributes.length} attributes</p>` : '';

    return `<div class="entity-subsection">
  <h4>Attributes (${attributes.length})</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th scope="col">Logical Name</th>
        <th scope="col">Display Name</th>
        <th scope="col">Type</th>
        <th scope="col">Required</th>
        <th scope="col">Description</th>
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
  <td>${this.htmlEscape(plugin.name)}</td>
  <td>${this.htmlEscape(plugin.message || '')}</td>
  <td>${this.htmlEscape(plugin.stageName || '')}</td>
  <td>${this.htmlEscape(plugin.modeName || '')}</td>
  <td style="word-break: break-word;">${this.htmlEscape(plugin.description || '')}</td>
</tr>`;
    }).join('\n');

    return `<div class="entity-subsection">
  <h4>Plugins (${plugins.length})</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Message</th>
        <th scope="col">Stage</th>
        <th scope="col">Mode</th>
        <th scope="col">Description</th>
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
  <td>${this.htmlEscape(flow.name)}</td>
  <td><span class="badge badge-${flow.state === 'Active' ? 'success' : flow.state === 'Draft' ? 'warning' : 'error'}">${this.htmlEscape(flow.state)}</span></td>
  <td>${this.htmlEscape(flow.definition.triggerEvent)}</td>
  <td style="word-break: break-word;">${this.htmlEscape(flow.description || '')}</td>
</tr>`;
    }).join('\n');

    return `<div class="entity-subsection">
  <h4>Flows (${flows.length})</h4>
  <table class="data-table">
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">State</th>
        <th scope="col">Trigger</th>
        <th scope="col">Description</th>
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
      ${description ? `<div class="entity-description">${this.htmlEscape(description)}</div>` : ''}
      <div class="entity-metadata">
        <h4>Entity Information</h4>
        <table class="metadata-table">
          ${metadata.map(([key, value]) => `<tr><th>${key}</th><td>${this.htmlEscape(value)}</td></tr>`).join('\n')}
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
            ${form.libraries.map(lib => `<span class="badge badge-info" style="font-family: monospace; font-size: 0.85em;">${this.htmlEscape(lib)}</span>`).join('')}
          </div>
        </div>` : '';

      const eventHandlersHtml = form.eventHandlers.length > 0 ? `
        <div class="entity-subsection" style="margin-top: 12px;">
          <h5 style="font-size: 0.9em; margin-bottom: 8px;">Event Handlers (${form.eventHandlers.length})</h5>
          <table class="data-table" style="font-size: 0.9em;">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Library</th>
                <th scope="col">Function</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              ${form.eventHandlers.map(handler => `
                <tr>
                  <td>${this.htmlEscape(handler.event)}${handler.attribute ? ` <span class="badge badge-secondary" style="font-size: 0.8em;">${this.htmlEscape(handler.attribute)}</span>` : ''}</td>
                  <td style="font-family: monospace;">${this.htmlEscape(handler.libraryName)}</td>
                  <td style="font-family: monospace;">${this.htmlEscape(handler.functionName)}${handler.parameters ? ` <span style="color: #666; font-size: 0.85em;">(${this.htmlEscape(handler.parameters)})</span>` : ''}</td>
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
            <h4 style="margin: 0; flex: 1;">${this.htmlEscape(form.name)}</h4>
            <span class="badge badge-primary">${this.htmlEscape(form.typeName)}</span>
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
      <p>This shows the execution order of server-side automation on <strong>${this.htmlEscape(displayName)}</strong>.</p>
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
        <h4>${this.htmlEscape(message)} Event</h4>`;

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
          ${idx + 1}. ${this.htmlEscape(br.name)} <span class="step-badge badge-${state}">[${state.toUpperCase()}]</span>
        </div>`;
      });

      html += `</div></div>`;
    }

    // Add plugin stages
    for (const [stage, plugins] of byStage) {
      const stageName = plugins[0].stageName;
      const stageClass = this.getStageClass(stage);

      html += `<div class="pipeline-stage ${stageClass}">
        <div class="stage-header">Stage ${stage}: ${this.htmlEscape(stageName)}</div>
        <div class="stage-steps">`;

      plugins.forEach((plugin, idx) => {
        const mode = plugin.mode === 0 ? 'sync' : 'async';
        html += `<div class="pipeline-step step-${mode}">
          ${idx + 1}. ${this.htmlEscape(plugin.name)} <span class="step-badge badge-${mode}">[${mode.toUpperCase()}]</span>
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
        <td>${this.htmlEscape(br.name)}</td>
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
        <td>${this.htmlEscape(plugin.name)}</td>
        <td>${this.htmlEscape(plugin.stageName)}</td>
        <td>${modeBadge}</td>
        <td>${plugin.rank}</td>
      </tr>`);
    });

    return `<table class="data-table pipeline-table">
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col">Type</th>
          <th scope="col">Name</th>
          <th scope="col">Stage/Details</th>
          <th scope="col">Mode</th>
          <th scope="col">Rank</th>
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
        <td>${this.htmlEscape(br.name)}</td>
        <td>${this.htmlEscape(br.scopeName)}</td>
        <td>${this.htmlEscape(br.definition.executionContext)}</td>
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
            <th scope="col">Name</th>
            <th scope="col">Scope</th>
            <th scope="col">Context</th>
            <th scope="col">State</th>
            <th scope="col">Conditions</th>
            <th scope="col">Actions</th>
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
  private generateRelationshipsSection(type: string, relationships: (OneToManyRelationship | ManyToOneRelationship | ManyToManyRelationship)[]): string {
    if (relationships.length === 0) return '';

    const rows = relationships.slice(0, 20).map(rel => {
      // Cast to a display-shape covering all three relationship subtypes.
      // OneToMany/ManyToOne use ReferencingEntity; ManyToMany uses Entity1LogicalName.
      const r = rel as { SchemaName?: string; ReferencingEntity?: string; ReferencedEntity?: string; ReferencedAttribute?: string; ReferencingAttribute?: string; Entity1LogicalName?: string };
      const schemaName = r.SchemaName || 'N/A';
      const referencingEntity = r.ReferencingEntity || r.ReferencedEntity || r.Entity1LogicalName || 'N/A';
      const referencedAttribute = r.ReferencedAttribute || r.ReferencingAttribute || 'N/A';

      return `<tr>
        <td>${this.htmlEscape(schemaName)}</td>
        <td>${this.htmlEscape(referencingEntity)}</td>
        <td>${this.htmlEscape(referencedAttribute)}</td>
      </tr>`;
    }).join('\n');

    const moreText = relationships.length > 20 ? `<p class="table-note">Showing 20 of ${relationships.length} relationships</p>` : '';

    return `<div class="relationship-section">
      <h5>${type} (${relationships.length})</h5>
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col">Schema Name</th>
            <th scope="col">Related Entity</th>
            <th scope="col">Related Attribute</th>
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
      return `<section id="plugins" class="content-section" aria-labelledby="heading-plugins">
  <h2 id="heading-plugins">Plugins</h2>
  <div class="empty-state">No plugins found</div>
</section>`;
    }

    const rows = plugins.map(plugin => {
      const images: string[] = [];
      if (plugin.preImage) images.push(plugin.preImage.imageType);
      if (plugin.postImage) images.push(plugin.postImage.imageType);
      const imagesText = images.length > 0 ? images.join(', ') : 'None';

      return `<tr>
  <td>${this.htmlEscape(plugin.name)}</td>
  <td>${this.htmlEscape(plugin.entity || 'N/A')}</td>
  <td><span class="badge badge-${plugin.state === 'Enabled' ? 'success' : 'error'}">${this.htmlEscape(plugin.state)}</span></td>
  <td>${this.htmlEscape(plugin.message || 'N/A')}</td>
  <td>${this.htmlEscape(plugin.stageName || 'N/A')}</td>
  <td>${this.htmlEscape(plugin.modeName || 'N/A')}</td>
  <td>${String(plugin.rank || 0)}</td>
  <td>${this.htmlEscape(imagesText)}</td>
</tr>`;
    }).join('\n');

    return `<section id="plugins" class="content-section" aria-labelledby="heading-plugins">
  <h2 id="heading-plugins">Plugins (${plugins.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="plugins-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('plugins-table', 0)">Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('plugins-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('plugins-table', 2)">State <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('plugins-table', 3)">Message <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('plugins-table', 4)">Stage <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('plugins-table', 5)">Mode <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('plugins-table', 6)">Rank <span class="sort-indicator"></span></th>
          <th scope="col">Images</th>
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
      return `<section id="flows" class="content-section" aria-labelledby="heading-flows">
  <h2 id="heading-flows">Flows</h2>
  <div class="empty-state">No flows found</div>
</section>`;
    }

    const rows = flows.map(flow => {
      const entityDisplay = flow.entityDisplayName || flow.entity || 'N/A';
      const hasExternal = flow.hasExternalCalls;

      return `<tr>
  <td>${this.htmlEscape(flow.name)}</td>
  <td>${this.htmlEscape(entityDisplay)}</td>
  <td><span class="badge badge-${flow.state === 'Active' ? 'success' : flow.state === 'Draft' ? 'warning' : 'error'}">${this.htmlEscape(flow.state)}</span></td>
  <td>${this.htmlEscape(flow.definition.triggerEvent)}</td>
  <td>${this.htmlEscape(flow.definition.scopeType)}</td>
  <td>${flow.definition.actionsCount}</td>
  <td>${hasExternal ? '<span class="badge badge-warning">Yes</span>' : '<span class="badge badge-info">No</span>'}</td>
</tr>`;
    }).join('\n');

    return `<section id="flows" class="content-section" aria-labelledby="heading-flows">
  <h2 id="heading-flows">Flows (${flows.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="flows-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('flows-table', 0)">Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('flows-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('flows-table', 2)">State <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('flows-table', 3)">Trigger <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('flows-table', 4)">Scope <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('flows-table', 5)">Actions <span class="sort-indicator"></span></th>
          <th scope="col">External Calls</th>
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
      return `<section id="business-rules" class="content-section" aria-labelledby="heading-business-rules">
  <h2 id="heading-business-rules" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('business-rules')} Business Rules</h2>
  <div class="empty-state">No business rules found</div>
</section>`;
    }

    const items = businessRules.map((rule, i) => {
      const entityDisplay = this.htmlEscape(rule.entityDisplayName || rule.entity);
      const conditions = rule.definition.conditions ?? [];
      const actions = rule.definition.actions ?? [];
      const id = `br-${i}`;

      const condRows = conditions.map(c => `<tr>
        <td><code>${this.htmlEscape(c.field)}</code></td>
        <td>${this.htmlEscape(c.operator)}</td>
        <td>${c.value ? this.htmlEscape(c.value) : '—'}</td>
        <td>${this.htmlEscape(c.logicOperator)}</td>
      </tr>`).join('');

      const actRows = actions.map(a => `<tr>
        <td><span class="badge badge-${a.type.startsWith('Show') || a.type === 'UnlockField' ? 'success' : a.type.startsWith('Hide') || a.type === 'LockField' ? 'warning' : 'info'}">${this.htmlEscape(a.type)}</span></td>
        <td><code>${this.htmlEscape(a.field)}</code></td>
        <td>${a.value ? this.htmlEscape(a.value) : a.message ? this.htmlEscape(a.message) : '—'}</td>
      </tr>`).join('');

      return `<div class="accordion-item">
  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}" onclick="toggleAccordion('${id}')" onkeydown="accordionKeydown(event,'${id}')">
    <span class="accordion-icon" id="icon-${id}">+</span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <strong>${this.htmlEscape(rule.name)}</strong>
        <span style="color:#666;font-size:0.9em">${entityDisplay}</span>
        <span class="badge badge-${rule.state === 'Active' ? 'success' : 'warning'}">${this.htmlEscape(rule.state)}</span>
        <span class="badge">${this.htmlEscape(rule.scope)}</span>
        <span class="badge badge-${rule.definition.executionContext === 'Server' || rule.definition.executionContext === 'Both' ? 'info' : 'warning'}">${this.htmlEscape(rule.definition.executionContext)}</span>
        ${conditions.length > 0 ? `<span class="badge">${conditions.length} condition${conditions.length !== 1 ? 's' : ''}</span>` : ''}
        ${actions.length > 0 ? `<span class="badge">${actions.length} action${actions.length !== 1 ? 's' : ''}</span>` : ''}
      </div>
      ${rule.description ? `<div style="font-size:0.85em;color:#666;margin-top:2px">${this.htmlEscape(rule.description)}</div>` : ''}
    </div>
  </div>
  <div class="accordion-content" id="${id}" style="display:none;padding:12px 16px;">
    ${rule.definition.parseError ? `<div class="alert alert-warning" style="margin-bottom:8px">Parse error: ${this.htmlEscape(rule.definition.parseError)}</div>` : ''}
    <div style="display:grid;grid-template-columns:minmax(200px,1fr) minmax(200px,1fr);gap:16px;">
      <div>
        <h5 style="margin-bottom:6px">Conditions${rule.definition.conditionLogic ? ` <span style="font-weight:normal;color:#666">(${this.htmlEscape(rule.definition.conditionLogic)})</span>` : ''}</h5>
        ${conditions.length > 0 ? `<table class="data-table" style="font-size:0.85em;"><thead><tr><th scope="col">Field</th><th scope="col">Operator</th><th scope="col">Value</th><th scope="col">Logic</th></tr></thead><tbody>${condRows}</tbody></table>` : '<p style="color:#666;font-size:0.85em">No conditions detected.</p>'}
      </div>
      <div>
        <h5 style="margin-bottom:6px">Actions</h5>
        ${actions.length > 0 ? `<table class="data-table" style="font-size:0.85em;"><thead><tr><th scope="col">Action</th><th scope="col">Field</th><th scope="col">Value / Message</th></tr></thead><tbody>${actRows}</tbody></table>` : '<p style="color:#666;font-size:0.85em">No actions detected.</p>'}
      </div>
    </div>
  </div>
</div>`;
    }).join('\n');

    return `<section id="business-rules" class="content-section" aria-labelledby="heading-business-rules">
  <h2 id="heading-business-rules" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('business-rules')} Business Rules (${businessRules.length})</h2>
  <div class="accordion">${items}</div>
</section>`;
  }

  /**
   * Generate classic workflows table section
   */
  htmlClassicWorkflowsTable(workflows: ClassicWorkflow[]): string {
    if (workflows.length === 0) {
      return `<section id="classic-workflows" class="content-section" aria-labelledby="heading-classic-workflows">
  <h2 id="heading-classic-workflows">Classic Workflows (Legacy)</h2>
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
  <td>${this.htmlEscape(workflow.name)}</td>
  <td>${this.htmlEscape(entityDisplay)}</td>
  <td><span class="badge badge-${workflow.state === 'Active' ? 'success' : workflow.state === 'Draft' ? 'warning' : 'error'}">${this.htmlEscape(workflow.state)}</span></td>
  <td>${this.htmlEscape(workflow.modeName)}</td>
  <td><span class="badge badge-${complexity === 'Critical' ? 'error' : complexity === 'High' ? 'warning' : 'info'}">${this.htmlEscape(complexity)}</span></td>
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

    return `<section id="classic-workflows" class="content-section" aria-labelledby="heading-classic-workflows">
  <h2 id="heading-classic-workflows">Classic Workflows - Migration Recommended (${workflows.length})</h2>
  <div class="alert alert-warning">
    <strong>${this.alertIcon('warning')} Warning &mdash; Legacy Technology:</strong> Classic workflows are legacy technology. Microsoft recommends creating new automation with Power Automate and migrating existing workflows. <a href="https://learn.microsoft.com/en-us/power-automate/replace-workflows-with-flows" target="_blank" rel="noopener noreferrer">Learn more</a>
  </div>
  ${advisorySection}
  <div class="table-container">
    <table class="data-table sortable" id="classic-workflows-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('classic-workflows-table', 0)">Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('classic-workflows-table', 1)">Entity <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('classic-workflows-table', 2)">State <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('classic-workflows-table', 3)">Mode <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('classic-workflows-table', 4)">Complexity <span class="sort-indicator"></span></th>
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
      return `<section id="business-process-flows" class="content-section" aria-labelledby="heading-business-process-flows">
  <h2 id="heading-business-process-flows" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('business-process-flows')} Business Process Flows</h2>
  <div class="empty-state">No business process flows found</div>
</section>`;
    }

    const items = bpfs.map((bpf, i) => {
      const entityDisplay = this.htmlEscape(bpf.primaryEntityDisplayName || bpf.primaryEntity);
      const stages = bpf.definition.stages ?? [];
      const id = `bpf-${i}`;

      const stageBlocks = stages.map((stage, si) => {
        const isLast = si === stages.length - 1;
        return `<div style="display:flex;flex-direction:column;align-items:flex-start;">
  <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f3f3f3;border-radius:6px;min-width:0;">
    <div style="min-width:26px;height:26px;border-radius:50%;background:#0078d4;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.8em;flex-shrink:0;">${si + 1}</div>
    <span style="font-weight:600;font-size:0.9em">${this.htmlEscape(stage.name)}</span>
    <code style="font-size:0.8em;color:#666;">${this.htmlEscape(stage.entity)}</code>
    ${stage.steps.length > 0 ? `<span class="badge">${stage.steps.length} step${stage.steps.length !== 1 ? 's' : ''}</span>` : ''}
  </div>
  ${!isLast ? '<div style="padding:2px 0 2px 12px;color:#999;font-size:1em;">↓</div>' : ''}
</div>`;
      }).join('');

      return `<div class="accordion-item">
  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}" onclick="toggleAccordion('${id}')" onkeydown="accordionKeydown(event,'${id}')">
    <span class="accordion-icon" id="icon-${id}">+</span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <strong>${this.htmlEscape(bpf.name)}</strong>
        <span style="color:#666;font-size:0.9em">${entityDisplay}</span>
        <span class="badge badge-${bpf.state === 'Active' ? 'success' : 'warning'}">${this.htmlEscape(bpf.state)}</span>
        <span class="badge">${stages.length} stage${stages.length !== 1 ? 's' : ''}</span>
        <span class="badge">${bpf.definition.totalSteps} step${bpf.definition.totalSteps !== 1 ? 's' : ''}</span>
        ${bpf.definition.crossEntityFlow ? '<span class="badge badge-info">Cross-entity</span>' : ''}
        ${bpf.isManaged ? '<span class="badge badge-info">Managed</span>' : ''}
      </div>
      ${bpf.description ? `<div style="font-size:0.85em;color:#666;margin-top:2px">${this.htmlEscape(bpf.description)}</div>` : ''}
    </div>
  </div>
  <div class="accordion-content" id="${id}" style="display:none;padding:12px 16px;">
    ${bpf.definition.parseError ? `<div class="alert alert-warning" style="margin-bottom:8px">Parse error: ${this.htmlEscape(bpf.definition.parseError)}</div>` : ''}
    ${stages.length > 0 ? stageBlocks : '<p style="color:#666">No stage details available.</p>'}
    ${bpf.definition.entities.length > 1 ? `<p style="margin-top:8px;font-size:0.8em;color:#666"><strong>Entities involved:</strong> ${bpf.definition.entities.map(e => this.htmlEscape(e)).join(', ')}</p>` : ''}
  </div>
</div>`;
    }).join('\n');

    return `<section id="business-process-flows" class="content-section" aria-labelledby="heading-business-process-flows">
  <h2 id="heading-business-process-flows" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('business-process-flows')} Business Process Flows (${bpfs.length})</h2>
  <div class="accordion">${items}</div>
</section>`;
  }

  /**
   * Generate web resources table section
   */
  htmlWebResourcesTable(webResources: WebResource[]): string {
    if (webResources.length === 0) {
      return `<section id="web-resources" class="content-section" aria-labelledby="heading-web-resources">
  <h2 id="heading-web-resources">Web Resources</h2>
  <div class="empty-state">No web resources found</div>
</section>`;
    }

    const rows = webResources.map(wr => {
      const sizeKB = (wr.contentSize / 1024).toFixed(2);
      const hasExternal = wr.hasExternalCalls;
      const deprecated = wr.isDeprecated;

      return `<tr>
  <td>${this.htmlEscape(wr.name)}</td>
  <td>${this.htmlEscape(wr.displayName)}</td>
  <td>${this.htmlEscape(wr.typeName)}</td>
  <td>${sizeKB} KB</td>
  <td>${hasExternal ? '<span class="badge badge-warning">Yes</span>' : 'No'}</td>
  <td>${deprecated ? '<span class="badge badge-error">Yes</span>' : 'No'}</td>
</tr>`;
    }).join('\n');

    return `<section id="web-resources" class="content-section" aria-labelledby="heading-web-resources">
  <h2 id="heading-web-resources">Web Resources (${webResources.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="web-resources-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('web-resources-table', 0)">Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('web-resources-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('web-resources-table', 2)">Type <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('web-resources-table', 3)">Size <span class="sort-indicator"></span></th>
          <th scope="col">External Calls</th>
          <th scope="col">Deprecated</th>
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
      return `<section id="custom-apis" class="content-section" aria-labelledby="heading-custom-apis">
  <h2 id="heading-custom-apis" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('custom-apis')} Custom APIs</h2>
  <div class="empty-state">No custom APIs found</div>
</section>`;
    }

    const paramTable = (params: CustomAPI['requestParameters'], label: string) => {
      if (!params || params.length === 0) return `<p style="margin:4px 0;color:#666;font-size:0.85em">No ${label.toLowerCase()}.</p>`;
      return `<table class="data-table" style="font-size:0.85em;margin-top:4px;">
  <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Required</th><th scope="col">Description</th></tr></thead>
  <tbody>${params.map(p => `<tr>
    <td><code>${this.htmlEscape(p.uniqueName)}</code>${p.displayName && p.displayName !== p.uniqueName ? ` <span style="color:#666;font-size:0.9em">${this.htmlEscape(p.displayName)}</span>` : ''}</td>
    <td><span class="badge badge-info">${this.htmlEscape(p.typeName || p.type)}</span>${p.logicalEntityName ? ` <span style="font-size:0.8em;color:#666">${this.htmlEscape(p.logicalEntityName)}</span>` : ''}</td>
    <td>${p.isOptional ? 'Optional' : '<span class="badge badge-warning">Required</span>'}</td>
    <td style="color:#666;font-size:0.9em">${p.description ? this.htmlEscape(p.description) : '—'}</td>
  </tr>`).join('')}</tbody>
</table>`;
    };

    const items = customAPIs.map((api, i) => {
      const type = api.isFunction ? 'Function' : 'Action';
      const id = `capi-${i}`;
      const paramCount = api.requestParameters?.length || 0;
      const respCount = api.responseProperties?.length || 0;
      const badges = [
        `<span class="badge badge-${api.isFunction ? 'info' : 'primary'}">${type}</span>`,
        `<span class="badge">${this.htmlEscape(api.bindingType)}</span>`,
        paramCount > 0 ? `<span class="badge badge-success">${paramCount} param${paramCount !== 1 ? 's' : ''}</span>` : '',
        respCount > 0 ? `<span class="badge badge-success">${respCount} response${respCount !== 1 ? 's' : ''}</span>` : '',
        api.isPrivate ? `<span class="badge badge-warning">Private</span>` : '',
        api.isManaged ? `<span class="badge badge-info">Managed</span>` : '',
      ].filter(Boolean).join(' ');

      return `<div class="accordion-item">
  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}" onclick="toggleAccordion('${id}')" onkeydown="accordionKeydown(event,'${id}')">
    <span class="accordion-icon" id="icon-${id}">+</span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <strong>${this.htmlEscape(api.displayName || api.uniqueName)}</strong>
        <code style="font-size:0.8em;color:#666">${this.htmlEscape(api.uniqueName)}</code>
        ${badges}
      </div>
      ${api.description ? `<div style="font-size:0.85em;color:#666;margin-top:2px">${this.htmlEscape(api.description)}</div>` : ''}
    </div>
  </div>
  <div class="accordion-content" id="${id}" style="display:none;padding:12px 16px;">
    <div style="display:grid;grid-template-columns:minmax(200px,1fr) minmax(200px,1fr);gap:16px;">
      <div>
        <h5 style="margin-bottom:6px">Request Parameters</h5>
        ${paramTable(api.requestParameters, 'Request parameters')}
      </div>
      <div>
        <h5 style="margin-bottom:6px">Response Properties</h5>
        ${paramTable(api.responseProperties, 'Response properties')}
      </div>
    </div>
    ${api.allowedCustomProcessingStepType !== 'None' ? `<p style="margin-top:8px;font-size:0.8em;color:#666"><strong>Custom processing steps:</strong> ${this.htmlEscape(api.allowedCustomProcessingStepType)}</p>` : ''}
  </div>
</div>`;
    }).join('\n');

    return `<section id="custom-apis" class="content-section" aria-labelledby="heading-custom-apis">
  <h2 id="heading-custom-apis" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('custom-apis')} Custom APIs (${customAPIs.length})</h2>
  <div class="accordion">${items}</div>
</section>`;
  }

  /**
   * Generate environment variables table section
   */
  htmlEnvironmentVariablesTable(envVars: EnvironmentVariable[]): string {
    if (envVars.length === 0) {
      return `<section id="environment-variables" class="content-section" aria-labelledby="heading-environment-variables">
  <h2 id="heading-environment-variables">Environment Variables</h2>
  <div class="empty-state">No environment variables found</div>
</section>`;
    }

    const rows = envVars.map(envVar => {
      const hasValue = !!envVar.currentValue;
      const required = envVar.isRequired;

      return `<tr>
  <td>${this.htmlEscape(envVar.schemaName)}</td>
  <td>${this.htmlEscape(envVar.displayName)}</td>
  <td>${this.htmlEscape(envVar.typeName)}</td>
  <td>${required ? '<span class="badge badge-error">Required</span>' : 'Optional'}</td>
  <td>${hasValue ? '<span class="badge badge-success">Set</span>' : '<span class="badge badge-warning">Not Set</span>'}</td>
</tr>`;
    }).join('\n');

    return `<section id="environment-variables" class="content-section" aria-labelledby="heading-environment-variables">
  <h2 id="heading-environment-variables">Environment Variables (${envVars.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="env-vars-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('env-vars-table', 0)">Schema Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('env-vars-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('env-vars-table', 2)">Type <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('env-vars-table', 3)">Required <span class="sort-indicator"></span></th>
          <th scope="col">Value Status</th>
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
      return `<section id="connection-references" class="content-section" aria-labelledby="heading-connection-references">
  <h2 id="heading-connection-references">Connection References</h2>
  <div class="empty-state">No connection references found</div>
</section>`;
    }

    const rows = connRefs.map(connRef => {
      const connector = connRef.connectorDisplayName || 'Unknown';
      const connected = !!connRef.connectionId;

      return `<tr>
  <td>${this.htmlEscape(connRef.name)}</td>
  <td>${this.htmlEscape(connRef.displayName)}</td>
  <td>${this.htmlEscape(connector)}</td>
  <td>${connected ? '<span class="badge badge-success">Connected</span>' : '<span class="badge badge-error">Not Connected</span>'}</td>
</tr>`;
    }).join('\n');

    return `<section id="connection-references" class="content-section" aria-labelledby="heading-connection-references">
  <h2 id="heading-connection-references">Connection References (${connRefs.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="conn-refs-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('conn-refs-table', 0)">Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('conn-refs-table', 1)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('conn-refs-table', 2)">Connector <span class="sort-indicator"></span></th>
          <th scope="col">Status</th>
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
   * Generate global choices section
   */
  htmlGlobalChoicesTable(globalChoices: GlobalChoice[]): string {
    if (globalChoices.length === 0) {
      return `<section id="global-choices" class="content-section" aria-labelledby="heading-global-choices">
  <h2 id="heading-global-choices" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('global-choices')} Global Choices</h2>
  <div class="empty-state">No global choices found</div>
</section>`;
    }

    const items = globalChoices.map(gc => {
      const managedBadge = gc.isManaged
        ? '<span class="badge badge-warning">Managed</span>'
        : '<span class="badge badge-success">Unmanaged</span>';
      const optionsHtml = gc.options.slice(0, 5).map(o =>
        `<span class="badge badge-info">${this.htmlEscape(o.label)} (${String(o.value)})</span>`
      ).join(' ');
      const moreCount = gc.options.length > 5 ? ` <span class="badge">+${String(gc.options.length - 5)} more</span>` : '';

      return `<div class="accordion-item">
  <button class="accordion-header" aria-expanded="false">
    <span class="accordion-title">${this.htmlEscape(gc.displayName)}</span>
    <span class="accordion-meta">${managedBadge} <span class="badge">${String(gc.totalOptions)} options</span></span>
    <span class="accordion-toggle">▼</span>
  </button>
  <div class="accordion-content" hidden>
    <div class="details-grid">
      <div class="detail-item"><span class="detail-label">Schema Name</span><span class="detail-value">${this.htmlEscape(gc.name)}</span></div>
      ${gc.description ? `<div class="detail-item"><span class="detail-label">Description</span><span class="detail-value">${this.htmlEscape(gc.description)}</span></div>` : ''}
      <div class="detail-item"><span class="detail-label">Customizable</span><span class="detail-value">${gc.isCustomizable ? 'Yes' : 'No'}</span></div>
      <div class="detail-item"><span class="detail-label">Modified</span><span class="detail-value">${this.htmlEscape(new Date(gc.modifiedOn).toLocaleDateString())}</span></div>
    </div>
    ${gc.options.length > 0 ? `<div class="detail-item"><span class="detail-label">Options</span><div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;">${optionsHtml}${moreCount}</div></div>` : ''}
  </div>
</div>`;
    }).join('\n');

    return `<section id="global-choices" class="content-section" aria-labelledby="heading-global-choices">
  <h2 id="heading-global-choices" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('global-choices')} Global Choices (${globalChoices.length})</h2>
  <div class="accordion">${items}</div>
</section>`;
  }

  /**
   * Generate custom connectors section
   */
  htmlCustomConnectorsTable(connectors: CustomConnector[]): string {
    if (connectors.length === 0) {
      return `<section id="custom-connectors" class="content-section" aria-labelledby="heading-custom-connectors">
  <h2 id="heading-custom-connectors" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('custom-connectors')} Custom Connectors</h2>
  <div class="empty-state">No custom connectors found</div>
</section>`;
    }

    const rows = connectors.map(c => {
      const managedBadge = c.isManaged
        ? '<span class="badge badge-warning">Managed</span>'
        : '<span class="badge badge-success">Unmanaged</span>';
      return `<tr>
  <td>${this.htmlEscape(c.displayName)}</td>
  <td>${this.htmlEscape(c.name)}</td>
  ${c.description ? `<td>${this.htmlEscape(c.description)}</td>` : '<td>—</td>'}
  <td>${managedBadge}</td>
  <td>${this.htmlEscape(new Date(c.modifiedOn).toLocaleDateString())}</td>
</tr>`;
    }).join('\n');

    return `<section id="custom-connectors" class="content-section" aria-labelledby="heading-custom-connectors">
  <h2 id="heading-custom-connectors" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('custom-connectors')} Custom Connectors (${connectors.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="custom-connectors-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('custom-connectors-table', 0)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('custom-connectors-table', 1)">Name <span class="sort-indicator"></span></th>
          <th scope="col">Description</th>
          <th scope="col" onclick="sortTable('custom-connectors-table', 3)">Managed <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('custom-connectors-table', 4)">Modified <span class="sort-indicator"></span></th>
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
   * Generate canvas apps section
   */
  htmlCanvasAppsTable(apps: CanvasApp[]): string {
    if (apps.length === 0) {
      return `<section id="canvas-apps" class="content-section" aria-labelledby="heading-canvas-apps">
  <h2 id="heading-canvas-apps" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('canvas-apps')} Canvas Apps</h2>
  <div class="empty-state">No canvas apps found</div>
</section>`;
    }

    const rows = apps.map(a => {
      const managedBadge = a.isManaged
        ? '<span class="badge badge-warning">Managed</span>'
        : '<span class="badge badge-success">Unmanaged</span>';
      return `<tr>
  <td>${this.htmlEscape(a.displayName)}</td>
  <td>${this.htmlEscape(a.name)}</td>
  ${a.description ? `<td>${this.htmlEscape(a.description)}</td>` : '<td>—</td>'}
  <td>${managedBadge}</td>
</tr>`;
    }).join('\n');

    return `<section id="canvas-apps" class="content-section" aria-labelledby="heading-canvas-apps">
  <h2 id="heading-canvas-apps" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('canvas-apps')} Canvas Apps (${apps.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="canvas-apps-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('canvas-apps-table', 0)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('canvas-apps-table', 1)">Name <span class="sort-indicator"></span></th>
          <th scope="col">Description</th>
          <th scope="col" onclick="sortTable('canvas-apps-table', 3)">Managed <span class="sort-indicator"></span></th>
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
   * Generate custom pages section
   */
  htmlCustomPagesTable(pages: CustomPage[]): string {
    if (pages.length === 0) {
      return `<section id="custom-pages" class="content-section" aria-labelledby="heading-custom-pages">
  <h2 id="heading-custom-pages" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('custom-pages')} Custom Pages</h2>
  <div class="empty-state">No custom pages found</div>
</section>`;
    }

    const rows = pages.map(p => {
      const managedBadge = p.isManaged
        ? '<span class="badge badge-warning">Managed</span>'
        : '<span class="badge badge-success">Unmanaged</span>';
      return `<tr>
  <td>${this.htmlEscape(p.displayName)}</td>
  <td>${this.htmlEscape(p.name)}</td>
  ${p.description ? `<td>${this.htmlEscape(p.description)}</td>` : '<td>—</td>'}
  <td>${managedBadge}</td>
</tr>`;
    }).join('\n');

    return `<section id="custom-pages" class="content-section" aria-labelledby="heading-custom-pages">
  <h2 id="heading-custom-pages" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('custom-pages')} Custom Pages (${pages.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="custom-pages-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('custom-pages-table', 0)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('custom-pages-table', 1)">Name <span class="sort-indicator"></span></th>
          <th scope="col">Description</th>
          <th scope="col" onclick="sortTable('custom-pages-table', 3)">Managed <span class="sort-indicator"></span></th>
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
   * Generate model-driven apps section
   */
  htmlModelDrivenAppsTable(apps: ModelDrivenApp[]): string {
    if (apps.length === 0) {
      return `<section id="model-driven-apps" class="content-section" aria-labelledby="heading-model-driven-apps">
  <h2 id="heading-model-driven-apps" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('model-driven-apps')} Model-Driven Apps</h2>
  <div class="empty-state">No model-driven apps found</div>
</section>`;
    }

    const rows = apps.map(a => {
      const managedBadge = a.isManaged
        ? '<span class="badge badge-warning">Managed</span>'
        : '<span class="badge badge-success">Unmanaged</span>';
      return `<tr>
  <td>${this.htmlEscape(a.displayName)}</td>
  <td>${this.htmlEscape(a.name)}</td>
  ${a.description ? `<td>${this.htmlEscape(a.description)}</td>` : '<td>—</td>'}
  <td>${managedBadge}</td>
  <td>${a.modifiedOn ? this.htmlEscape(new Date(a.modifiedOn).toLocaleDateString()) : '—'}</td>
</tr>`;
    }).join('\n');

    return `<section id="model-driven-apps" class="content-section" aria-labelledby="heading-model-driven-apps">
  <h2 id="heading-model-driven-apps" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('model-driven-apps')} Model-Driven Apps (${apps.length})</h2>
  <div class="table-container">
    <table class="data-table sortable" id="model-driven-apps-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('model-driven-apps-table', 0)">Display Name <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('model-driven-apps-table', 1)">Unique Name <span class="sort-indicator"></span></th>
          <th scope="col">Description</th>
          <th scope="col" onclick="sortTable('model-driven-apps-table', 3)">Managed <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('model-driven-apps-table', 4)">Modified <span class="sort-indicator"></span></th>
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
      return `<section id="external-dependencies" class="content-section" aria-labelledby="heading-external-dependencies">
  <h2 id="heading-external-dependencies">External Dependencies</h2>
  <div class="empty-state">No external dependencies detected</div>
</section>`;
    }

    const rows = endpoints.map(endpoint => {
      const riskColor = endpoint.riskLevel === 'Trusted' ? 'success' : endpoint.riskLevel === 'Known' ? 'warning' : 'error';
      const riskFactorsText = endpoint.riskFactors.map(rf => rf.factor).join(', ') || 'None';

      return `<tr>
  <td>${this.htmlEscape(endpoint.domain)}</td>
  <td>${this.htmlEscape(endpoint.protocol.toUpperCase())}</td>
  <td><span class="badge badge-${riskColor}">${this.htmlEscape(endpoint.riskLevel)}</span></td>
  <td>${String(endpoint.callCount)}</td>
  <td>${this.htmlEscape(riskFactorsText)}</td>
</tr>`;
    }).join('\n');

    return `<section id="external-dependencies" class="content-section" aria-labelledby="heading-external-dependencies">
  <h2 id="heading-external-dependencies">External Dependencies (${endpoints.length})</h2>
  <div class="alert alert-info">
    <strong>${this.alertIcon('info')} Note:</strong> External API calls can introduce security risks and performance concerns. Review each endpoint carefully.
  </div>
  <div class="table-container">
    <table class="data-table sortable" id="external-deps-table">
      <thead>
        <tr>
          <th scope="col" onclick="sortTable('external-deps-table', 0)">Domain <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('external-deps-table', 1)">Protocol <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('external-deps-table', 2)">Risk Level <span class="sort-indicator"></span></th>
          <th scope="col" onclick="sortTable('external-deps-table', 3)">Calls <span class="sort-indicator"></span></th>
          <th scope="col">Risk Factors</th>
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
   * Generate solution distribution section
   */
  htmlSolutionDistribution(distributions: SolutionDistribution[] | undefined): string {
    if (!distributions || distributions.length === 0) {
      return `<section id="solutions" class="content-section" aria-labelledby="heading-solutions">
  <h2 id="heading-solutions" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('solutions')} Solutions</h2>
  <div class="empty-state">No solution distribution information available.</div>
</section>`;
    }

    const rows = distributions.map((sol) => {
      const counts = sol.componentCounts;
      const countRows = [
        ['Entities', counts.entities],
        ['Plugins', counts.plugins],
        ['Flows', counts.flows],
        ['Business Rules', counts.businessRules],
        ['Classic Workflows', counts.classicWorkflows],
        ['Business Process Flows', counts.bpfs],
        ['Web Resources', counts.webResources],
        ['Custom APIs', counts.customAPIs],
        ['Environment Variables', counts.environmentVariables],
        ['Connection References', counts.connectionReferences],
        ['Global Choices', counts.globalChoices],
        ['Custom Connectors', counts.customConnectors],
        ['Security Roles', counts.securityRoles],
        ['Field Security Profiles', counts.fieldSecurityProfiles],
        ['Canvas Apps', counts.canvasApps],
        ['Custom Pages', counts.customPages],
        ['Model-Driven Apps', counts.modelDrivenApps],
      ].filter(([, n]) => (n as number) > 0);

      const countHtml = countRows.map(([label, n]) =>
        `<tr><td>${this.htmlEscape(String(label))}</td><td style="text-align:right;font-weight:600;">${n}</td></tr>`
      ).join('');

      const sharedHtml = sol.sharedComponents.length > 0
        ? `<details style="margin-top:12px;"><summary style="cursor:pointer;font-weight:600;">Shared Components (${sol.sharedComponents.length})</summary>
        <table class="data-table" style="margin-top:8px;"><thead><tr><th scope="col">Type</th><th scope="col">Name</th><th scope="col">Also In</th></tr></thead>
        <tbody>${sol.sharedComponents.map(sc => `<tr><td>${this.htmlEscape(sc.componentType)}</td><td>${this.htmlEscape(sc.componentName)}</td><td>${sc.alsoInSolutions.map(s => this.htmlEscape(s)).join(', ')}</td></tr>`).join('')}</tbody></table>
        </details>`
        : '';

      return `<div class="card" style="margin-bottom:16px;padding:16px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <span style="font-size:1.1em;font-weight:700;">${this.htmlEscape(sol.solutionName)}</span>
    <span class="badge ${sol.isManaged ? 'badge-warning' : 'badge-success'}">${sol.isManaged ? 'Managed' : 'Unmanaged'}</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:12px;">
    <div><span style="color:#666;font-size:0.85em;">Publisher</span><div style="font-weight:600;">${this.htmlEscape(sol.publisher)}</div></div>
    <div><span style="color:#666;font-size:0.85em;">Version</span><div style="font-weight:600;">${this.htmlEscape(sol.version)}</div></div>
    <div><span style="color:#666;font-size:0.85em;">Total Components</span><div style="font-weight:600;">${counts.total}</div></div>
  </div>
  ${countRows.length > 0 ? `<table class="data-table" style="max-width:400px;"><thead><tr><th scope="col">Component Type</th><th scope="col" style="text-align:right;">Count</th></tr></thead><tbody>${countHtml}</tbody></table>` : ''}
  ${sharedHtml}
</div>`;
    });

    return `<section id="solutions" class="content-section" aria-labelledby="heading-solutions">
  <h2 id="heading-solutions" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('solutions')} Solutions (${distributions.length})</h2>
  ${rows.join('\n  ')}
</section>`;
  }

  /**
   * Generate cross-entity automation section
   */
  htmlCrossEntitySection(analysis: CrossEntityAnalysisResult | undefined): string {
    const coverageNotice = `<div class="alert alert-info" style="margin-bottom: 16px;">
      <strong>Detection Coverage</strong> <span class="badge badge-warning" style="font-size:0.75em;vertical-align:middle;">Preview</span>
      <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">
        <div style="display:flex;align-items:center;gap:6px;">${this.navIcon('flows')} <span><strong>Power Automate flows</strong> — cross-entity writes detected from flow JSON definitions.</span></div>
        <div style="display:flex;align-items:center;gap:6px;">${this.navIcon('classic-workflows')} <span><strong>Classic Workflows</strong> — cross-entity writes detected from XAML (CreateEntity / UpdateEntity steps).</span></div>
        <div style="display:flex;align-items:center;gap:6px;">${this.navIcon('business-rules')} <span><strong>Business Rules (server-scoped)</strong> — server-side rules detected from Dataverse workflow records. Form-scoped (client-only) rules are excluded.</span></div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.1);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:0.8em;color:#666;">Coming soon</span>
          <span class="badge badge-info" style="font-size:0.75em;">Planned</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;align-items:center;gap:6px;color:#666;">${this.navIcon('plugins')} <span><strong>Plugins (deep detection)</strong> — currently shows that a plugin fires (stage, filter attributes, firing status), but cannot identify what the plugin code itself writes to other entities. Plugin assembly decompilation is planned.</span></div>
          <div style="display:flex;align-items:center;gap:6px;color:#666;">${this.navIcon('web-resources')} <span><strong>JavaScript Web Resources (static analysis)</strong> — currently cannot detect cross-entity Dataverse API calls embedded in custom JavaScript. JS static analysis is planned.</span></div>
        </div>
      </div>
    </div>`;

    if (!analysis || (analysis.allEntityPipelines.size === 0 && analysis.totalEntryPoints === 0)) {
      return `<section id="cross-entity" class="content-section" aria-labelledby="heading-cross-entity">
  <h2 id="heading-cross-entity" style="display:flex;align-items:center;gap:10px;">${this.navIcon('cross-entity')} Cross-Entity Automation <span class="badge badge-warning" style="font-size:0.75em;">Preview</span></h2>
  ${coverageNotice}
  <p>No cross-entity automation entry points detected in this solution scope.</p>
</section>`;
    }

    // Stats — matches the React UI summary cards
    const noFilterCard = analysis.noFilterPluginCount > 0
      ? `<div class="stats-card"><div class="stats-value stats-value-danger">${analysis.noFilterPluginCount}</div><div class="stats-label">No-Filter Plugins</div></div>`
      : '';
    const statsHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
      <div class="stats-card"><div class="stats-value">${analysis.allEntityPipelines.size}</div><div class="stats-label">Entities w/ Automation</div></div>
      <div class="stats-card"><div class="stats-value">${analysis.entityViews.size}</div><div class="stats-label">Target Entities</div></div>
      <div class="stats-card"><div class="stats-value">${analysis.totalBranches}</div><div class="stats-label">Cross-Entity Writes</div></div>
      ${noFilterCard}
      <div class="stats-card"><div class="stats-value stats-value-danger">${analysis.risks.filter(r => r.severity === 'High').length}</div><div class="stats-label">High Risks</div></div>
    </div>`;

    // Risks
    const risksHtml = analysis.risks.length > 0 ? `
      <h3>Performance &amp; Risk Warnings</h3>
      ${analysis.risks.map(r => `
        <div class="alert ${r.severity === 'High' ? 'alert-danger' : 'alert-warning'}" style="margin-bottom:8px;">
          <strong>${this.htmlEscape(r.type)}</strong> (${this.htmlEscape(r.severity)}) ${r.automationName ? `— ${this.htmlEscape(r.automationName)}` : ''}<br/>
          <span>${this.htmlEscape(r.description)}</span>
        </div>`).join('')}` : '';

    // Pipeline Traces — default view matches the React UI "Pipeline Traces" tab
    const pipelineTracesHtml = `
      <h3>Pipeline Traces</h3>
      <p style="color:#666;margin-bottom:12px;">Per-entity activation analysis. By default shows entities with cross-entity outputs. Use the checkbox to reveal all entities with automation.</p>
      ${this.htmlPipelineTraces(analysis)}`;

    // Global Chain Map — matches the React UI "Global Chain Map" tab
    const chainRows = analysis.chainLinks.map(l => `<tr>
      <td>${this.htmlEscape(l.sourceEntityDisplayName)}<br/><small style="font-family:monospace;color:#666">${this.htmlEscape(l.sourceEntity)}</small></td>
      <td>${this.htmlEscape(l.automationName)}<br/><span class="badge badge-${l.automationType === 'Flow' ? 'success' : 'warning'}">${this.htmlEscape(l.automationType)}</span></td>
      <td>→</td>
      <td>${this.htmlEscape(l.targetEntityDisplayName)}<br/><small style="font-family:monospace;color:#666">${this.htmlEscape(l.targetEntity)}</small></td>
      <td><span class="badge badge-${l.operation === 'Create' ? 'success' : l.operation === 'Delete' ? 'danger' : 'warning'}">${this.htmlEscape(l.operation)}</span></td>
      <td><span class="badge badge-${l.isAsynchronous ? 'success' : 'warning'}">${l.isAsynchronous ? 'Async' : 'Sync'}</span></td>
    </tr>`).join('');
    const globalChainHtml = analysis.chainLinks.length > 0 ? `
      <h3>Global Chain Map (${analysis.chainLinks.length})</h3>
      <p style="color:#666;margin-bottom:12px;">All detected cross-entity write operations. Synchronous operations may impact performance.</p>
      <div class="table-container">
        <table class="data-table sortable" id="cross-entity-table">
          <thead>
            <tr>
              <th scope="col" onclick="sortTable('cross-entity-table', 0)">Source Entity <span class="sort-indicator"></span></th>
              <th scope="col" onclick="sortTable('cross-entity-table', 1)">Automation <span class="sort-indicator"></span></th>
              <th scope="col"></th>
              <th scope="col" onclick="sortTable('cross-entity-table', 3)">Target Entity <span class="sort-indicator"></span></th>
              <th scope="col" onclick="sortTable('cross-entity-table', 4)">Operation <span class="sort-indicator"></span></th>
              <th scope="col">Mode</th>
            </tr>
          </thead>
          <tbody>${chainRows}</tbody>
        </table>
      </div>` : '';

    return `<section id="cross-entity" class="content-section" aria-labelledby="heading-cross-entity">
  <h2 id="heading-cross-entity" style="display:flex;align-items:center;gap:10px;">${this.navIcon('cross-entity')} Cross-Entity Automation <span class="badge badge-warning" style="font-size:0.75em;">Preview</span></h2>
  ${coverageNotice}
  ${statsHtml}
  ${risksHtml}
  ${pipelineTracesHtml}
  ${globalChainHtml}
</section>`;
  }

  /**
   * Render pipeline trace accordions for all entities with automation.
   * Matches the React UI "Pipeline Traces" tab behaviour:
   *   - Default: shows only entities with cross-entity output (hasCrossEntityOutput)
   *   - Checkbox: reveals all entities with any automation
   *   - Entities with inbound entry points (entityViews) → CEA trace accordion
   *   - Entities without inbound entry points → message pipeline step table
   */
  private htmlPipelineTraces(analysis: CrossEntityAnalysisResult): string {
    const pipelines = Array.from(analysis.allEntityPipelines.entries())
      .sort(([, a], [, b]) => a.entityDisplayName.localeCompare(b.entityDisplayName));
    if (pipelines.length === 0) return '<p>No pipeline traces available.</p>';

    const COLORS = ['#0078d4','#107c10','#ca5010','#8764b8','#038387','#c239b3','#e3008c','#004b50'];
    const colorMap = new Map(pipelines.map(([k], i) => [k, i]));
    const entityColor = (key: string) => COLORS[(colorMap.get(key) ?? 0) % COLORS.length];

    const firingBadge = (status: string): string => {
      if (status === 'WillFire') return '<span class="badge badge-success">Yes</span>';
      if (status === 'WontFire') return '<span class="badge badge-danger">No (field mismatch)</span>';
      return '<span class="badge badge-warning">Yes (no filter)</span>';
    };

    const defaultCount = pipelines.filter(([, p]) => p.hasCrossEntityOutput || p.hasExternalInteraction).length;
    const allCount = pipelines.length;
    const checkboxHtml = allCount > defaultCount ? `<div style="margin-bottom:4px;">
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-size:0.9em;">
    <input type="checkbox" id="cea-show-all" onchange="toggleCeaAllEntities(this.checked)" style="cursor:pointer">
    Show all entities with automation
  </label>
</div>
<p style="font-size:0.8em;color:#666;margin:0 0 12px">Default: entities with cross-entity writes or external API calls.</p>` : '';

    const items: string[] = [];
    let idx = 0;
    for (const [logicalName, pipeline] of pipelines) {
      const entityView = analysis.entityViews.get(logicalName);
      const color = entityColor(logicalName);
      const id = `cea-entity-${idx++}`;
      const showByDefault = pipeline.hasCrossEntityOutput || pipeline.hasExternalInteraction;
      const wrapClass = showByDefault ? 'cea-entity' : 'cea-entity cea-entity-no-output';
      const hiddenAttr = showByDefault ? '' : ' style="display:none"';

      const opBadges = pipeline.messagePipelines
        .map(mp => {
          const c = mp.message === 'Create' ? 'success' : mp.message === 'Delete' ? 'danger' : 'warning';
          return `<span class="badge badge-${c}">${this.htmlEscape(mp.message)}</span>`;
        }).join(' ');
      const crossBadge = pipeline.hasCrossEntityOutput ? `<span class="badge badge-info">→ cross-entity</span>` : '';
      const externalBadge = pipeline.hasExternalInteraction ? `<span class="badge badge-primary">&#8627; External calls</span>` : '';

      let bodyHtml: string;
      let entryCountHtml = '';

      if (entityView) {
        // Entity receives cross-entity writes — show full CEA trace
        entryCountHtml = entityView.traces.length > 1
          ? `<span style="font-size:0.85em;color:#666;margin-left:8px">${entityView.traces.length} entry points</span>` : '';

        const traceBlocks = entityView.traces.map((trace, ti) => {
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
  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${tid}" onclick="toggleAccordion('${tid}')" onkeydown="accordionKeydown(event,'${tid}')" style="font-size:0.9em;">
    <span class="accordion-icon" id="icon-${tid}">+</span>
    <span>${header}</span>
    <span class="badge badge-${entryPoint.confidence === 'High' ? 'success' : entryPoint.confidence === 'Medium' ? 'warning' : 'danger'}" style="margin-left:auto">${this.htmlEscape(entryPoint.confidence)} confidence</span>
  </div>
  <div class="accordion-content" id="${tid}" style="display:none;padding:12px;">
    ${riskHtml}
    <table class="data-table" style="font-size:0.85em;">
      <thead><tr><th scope="col">Automation</th><th scope="col">Type</th><th scope="col">Stage</th><th scope="col">Mode</th><th scope="col">Fires?</th><th scope="col">Matched Fields</th><th scope="col">Downstream</th></tr></thead>
      <tbody>${actRows}</tbody>
    </table>
    ${entryPoint.fields.length > 0 ? `<p style="margin-top:8px;font-size:0.8em;color:#666"><strong>Fields set by source:</strong> <code>${this.htmlEscape(entryPoint.fields.join(', '))}</code></p>` : ''}
  </div>
</div>`;
        }).join('');
        // Also show Manual/On-Demand pipelines (flows with no inbound trigger match)
        const manualPipelines = pipeline.messagePipelines.filter(mp => mp.message === 'Manual');
        const manualBlocks = manualPipelines.map(mp => {
          const stepRows = mp.steps.map((step, si) => {
            const noFilterHtml = step.firesForAllUpdates ? '<span class="badge badge-danger">No filter</span>' : '';
            const filters = step.filteringAttributes.length > 0 && !step.firesForAllUpdates
              ? `<span style="font-size:0.8em;color:#666">filters: ${this.htmlEscape(step.filteringAttributes.slice(0, 3).join(', '))}${step.filteringAttributes.length > 3 ? ` +${step.filteringAttributes.length - 3}` : ''}</span>`
              : '';
            const ds = step.downstream
              ? `→ <strong>${this.htmlEscape(step.downstream.targetEntityDisplayName)}</strong> (${this.htmlEscape(step.downstream.operation)})`
              : '';
            const extBadge = step.hasExternalCalls ? '<span class="badge badge-primary" style="margin-left:4px">&#8627; External calls</span>' : '';
            const connHtml = step.connectionReferences && step.connectionReferences.length > 0
              ? `<br><span style="font-size:0.8em;color:#666">${step.connectionReferences.map(r => `<span class="badge" style="background:#eee;color:#333;margin:1px">${this.htmlEscape(r)}</span>`).join(' ')}</span>`
              : '';
            const urlHtml = step.externalCallSummaries && step.externalCallSummaries.length > 0
              ? `<br>${step.externalCallSummaries.map(c => `<span style="font-family:monospace;font-size:0.75em;color:#555">${this.htmlEscape(c.method ? `${c.method} ` : '')}${this.htmlEscape(c.url || c.domain)}</span>`).join('<br>')}`
              : '';
            return `<tr>
              <td>${si + 1}</td>
              <td>${this.htmlEscape(step.automationName)}${extBadge}${connHtml}${urlHtml}</td>
              <td><span class="badge badge-${step.automationType === 'Plugin' ? 'warning' : 'success'}">${this.htmlEscape(step.automationType)}</span></td>
              <td>${this.htmlEscape(step.stageName ?? '—')}</td>
              <td><span class="badge badge-${step.mode === 'Sync' ? 'warning' : 'success'}">${this.htmlEscape(step.mode)}</span></td>
              <td>${noFilterHtml}${filters}</td>
              <td>${ds}</td>
            </tr>`;
          }).join('');
          return `<div style="margin-top:12px"><h5 style="margin:4px 0 6px">On-Demand / Manual Pipeline</h5><table class="data-table" style="font-size:0.85em;">
  <thead><tr><th scope="col">#</th><th scope="col">Automation</th><th scope="col">Type</th><th scope="col">Stage</th><th scope="col">Mode</th><th scope="col">Filter</th><th scope="col">Downstream</th></tr></thead>
  <tbody>${stepRows}</tbody>
</table></div>`;
        }).join('');
        bodyHtml = `<div class="accordion">${traceBlocks}</div>${manualBlocks}`;
      } else {
        // Entity has outgoing automation but no inbound entry points — show message pipelines
        const msgBlocks = pipeline.messagePipelines.map(mp => {
          const stepRows = mp.steps.map((step, si) => {
            const noFilterHtml = step.firesForAllUpdates ? '<span class="badge badge-danger">No filter</span>' : '';
            const filters = step.filteringAttributes.length > 0 && !step.firesForAllUpdates
              ? `<span style="font-size:0.8em;color:#666">filters: ${this.htmlEscape(step.filteringAttributes.slice(0, 3).join(', '))}${step.filteringAttributes.length > 3 ? ` +${step.filteringAttributes.length - 3}` : ''}</span>`
              : '';
            const ds = step.downstream
              ? `→ <strong>${this.htmlEscape(step.downstream.targetEntityDisplayName)}</strong> (${this.htmlEscape(step.downstream.operation)})`
              : '';
            const extBadge = step.hasExternalCalls ? '<span class="badge badge-primary" style="margin-left:4px">&#8627; External calls</span>' : '';
            const connHtml = step.connectionReferences && step.connectionReferences.length > 0
              ? `<br><span style="font-size:0.8em;color:#666">${step.connectionReferences.map(r => `<span class="badge" style="background:#eee;color:#333;margin:1px">${this.htmlEscape(r)}</span>`).join(' ')}</span>`
              : '';
            const urlHtml = step.externalCallSummaries && step.externalCallSummaries.length > 0
              ? `<br>${step.externalCallSummaries.map(c => `<span style="font-family:monospace;font-size:0.75em;color:#555">${this.htmlEscape(c.method ? `${c.method} ` : '')}${this.htmlEscape(c.url || c.domain)}</span>`).join('<br>')}`
              : '';
            return `<tr>
              <td>${si + 1}</td>
              <td>${this.htmlEscape(step.automationName)}${extBadge}${connHtml}${urlHtml}</td>
              <td><span class="badge badge-${step.automationType === 'Plugin' ? 'warning' : 'success'}">${this.htmlEscape(step.automationType)}</span></td>
              <td>${this.htmlEscape(step.stageName ?? '—')}</td>
              <td><span class="badge badge-${step.mode === 'Sync' ? 'warning' : 'success'}">${this.htmlEscape(step.mode)}</span></td>
              <td>${noFilterHtml}${filters}</td>
              <td>${ds}</td>
            </tr>`;
          }).join('');
          return `${pipeline.messagePipelines.length > 1 ? `<h5 style="margin:4px 0 6px">${this.htmlEscape(mp.message)} Pipeline</h5>` : ''}<table class="data-table" style="font-size:0.85em;">
  <thead><tr><th scope="col">#</th><th scope="col">Automation</th><th scope="col">Type</th><th scope="col">Stage</th><th scope="col">Mode</th><th scope="col">Filter</th><th scope="col">Downstream</th></tr></thead>
  <tbody>${stepRows}</tbody>
</table>`;
        }).join('<hr style="margin:8px 0;border:none;border-top:1px solid #eee">');
        bodyHtml = msgBlocks;
      }

      const totalSteps = pipeline.messagePipelines.reduce((sum, mp) => sum + mp.steps.length, 0);
      const stepCount = entityView
        ? `${entityView.traces.length} ${entityView.traces.length === 1 ? 'entry point' : 'entry points'}`
        : `${totalSteps} ${totalSteps === 1 ? 'step' : 'steps'}`;

      items.push(`<div class="${wrapClass}"${hiddenAttr}><div class="accordion-item">
  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}" onclick="toggleAccordion('${id}')" onkeydown="accordionKeydown(event,'${id}')" style="border-left:4px solid ${color}">
    <span class="accordion-icon" id="icon-${id}">+</span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <strong>${this.htmlEscape(pipeline.entityDisplayName)}</strong>
        <small style="color:#666;font-family:monospace">${this.htmlEscape(logicalName)}</small>
        ${opBadges} ${crossBadge} ${externalBadge} ${entryCountHtml}
      </div>
    </div>
    <span style="font-size:0.85em;color:#666;flex-shrink:0">${stepCount}</span>
  </div>
  <div class="accordion-content" id="${id}" style="display:none;padding:12px 16px;">
    ${bodyHtml}
  </div>
</div></div>`);
    }

    return `${checkboxHtml}<div class="accordion">${items.join('\n')}</div>`;
  }

  /**
   * HTML-escape a string to prevent XSS
   */
  private htmlEscape(str: string): string {
    const s = str || '';
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
   * Uses actual Fluent UI icon path data extracted from @fluentui/react-icons.
   * All icons use fill="currentColor" so they inherit the surrounding text colour.
   * ViewBox is "0 0 24 24" matching the 24-size Fluent UI Regular icons.
   */
  private navIcon(key: string): string {
    const s = `width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"`;
    const icons: Record<string, string> = {
      // Grid24Regular
      summary:   `<svg ${s}><path d="M6.25 3A3.25 3.25 0 0 0 3 6.25v11.5C3 19.55 4.46 21 6.25 21h11.5c1.8 0 3.25-1.46 3.25-3.25V6.25C21 4.45 19.54 3 17.75 3H6.25ZM4.5 6.25c0-.97.78-1.75 1.75-1.75h5V7h-1.5A2.75 2.75 0 0 0 7 9.75v1.5H4.5v-5Zm2.5 6.5v1.5A2.75 2.75 0 0 0 9.75 17h1.5v2.5h-5c-.97 0-1.75-.78-1.75-1.75v-5H7Zm4.25 2.75h-1.5c-.69 0-1.25-.56-1.25-1.25v-1.5h2.75v2.75Zm1.5 1.5h1.5A2.75 2.75 0 0 0 17 14.25v-1.5h2.5v5c0 .97-.78 1.75-1.75 1.75h-5V17Zm2.75-4.25v1.5c0 .69-.56 1.25-1.25 1.25h-1.5v-2.75h2.75Zm1.5-1.5v-1.5A2.75 2.75 0 0 0 14.25 7h-1.5V4.5h5c.97 0 1.75.78 1.75 1.75v5H17ZM12.75 8.5h1.5c.69 0 1.25.56 1.25 1.25v1.5h-2.75V8.5Zm-1.5 0v2.75H8.5v-1.5c0-.69.56-1.25 1.25-1.25h1.5Z"/></svg>`,
      // LayerDiagonal24Regular — stacked layers = solutions/packages
      solutions: `<svg ${s}><path d="M13.13 2.12a3.25 3.25 0 0 0-2.26 0L3.65 4.8A1.75 1.75 0 0 0 3.65 8l7.22 2.68c.73.27 1.53.27 2.26 0L20.35 8a1.75 1.75 0 0 0 0-3.2l-7.22-2.68Zm-1.75 1.41c.4-.14.84-.14 1.24 0l7.04 2.6-7.04 2.6a1.75 1.75 0 0 1-1.24 0L4.34 6.13l7.04-2.6ZM3.2 11.1l7.66 2.84c.73.27 1.53.27 2.27 0l7.66-2.84a.75.75 0 1 1 .52 1.41l-7.66 2.84a3.25 3.25 0 0 1-2.3 0L3.69 12.5a.75.75 0 1 1 .52-1.41Zm0 4.5 7.66 2.83c.73.27 1.53.27 2.27 0l7.66-2.83a.75.75 0 1 1 .52 1.4l-7.66 2.84a3.25 3.25 0 0 1-2.3 0L3.69 17a.75.75 0 1 1 .52-1.4Z"/></svg>`,
      // Organization24Regular
      erd:       `<svg ${s}><path d="M11.75 2A3.75 3.75 0 0 0 11 9.43v2.07H7.75c-1.24 0-2.25 1-2.25 2.25v.83a3.75 3.75 0 1 0 1.5 0v-.83c0-.41.34-.75.75-.75h8c.41 0 .75.34.75.75v.83a3.75 3.75 0 1 0 1.5 0v-.83c0-1.24-1-2.25-2.25-2.25H12.5V9.43A3.75 3.75 0 0 0 11.75 2ZM9.5 5.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM4 18.25a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM17.25 16a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z"/></svg>`,
      // Table24Regular
      entities:  `<svg ${s}><path d="M3 6.25C3 4.45 4.46 3 6.25 3h11.5C19.55 3 21 4.46 21 6.25v11.5c0 1.8-1.46 3.25-3.25 3.25H6.25A3.25 3.25 0 0 1 3 17.75V6.25ZM6.25 4.5c-.97 0-1.75.78-1.75 1.75V8.5h4v-4H6.25ZM4.5 10v4h4v-4h-4Zm5.5 0v4h4v-4h-4Zm5.5 0v4h4v-4h-4ZM14 15.5h-4v4h4v-4Zm1.5 4h2.25c.97 0 1.75-.78 1.75-1.75V15.5h-4v4Zm0-11h4V6.25c0-.97-.78-1.75-1.75-1.75H15.5v4Zm-1.5-4h-4v4h4v-4Zm-9.5 11v2.25c0 .97.78 1.75 1.75 1.75H8.5v-4h-4Z"/></svg>`,
      // PuzzlePiece24Regular — matches Microsoft's "Plug-in assemblies" icon
      plugins:   `<svg ${s}><path d="M13 2a3 3 0 0 1 3 2.82V5h2.25c.87 0 1.59.63 1.73 1.46l.01.15.01.14v3.75h-2a1.5 1.5 0 0 0-1.48 1.24l-.01.13V12c0 .74.53 1.37 1.23 1.48l.13.02H20v3.75c0 .92-.7 1.67-1.6 1.75H16v.17a3 3 0 0 1-2.64 2.8l-.18.02H13a3 3 0 0 1-3-2.81V19H7.75c-.87 0-1.59-.63-1.73-1.46l-.01-.14-.01-.15V15h-.16a3 3 0 0 1-2.8-2.64l-.02-.18V12a3 3 0 0 1 2.82-3H6V6.75c0-.87.63-1.59 1.46-1.73l.15-.01.14-.01H10v-.17a3 3 0 0 1 2.64-2.8l.18-.02H13Zm0 1.5c-.78 0-1.42.6-1.5 1.36V6.5H7.75a.25.25 0 0 0-.24.2l-.01.05v3.75H6a1.5 1.5 0 0 0-.14 3H7.5v3.75c0 .12.08.22.2.25h3.8V19a1.5 1.5 0 0 0 3 .14V17.5h3.75c.12 0 .22-.08.24-.19l.01-.06V15h-.7a3 3 0 0 1-2.8-2.85v-.35A3 3 0 0 1 17.84 9h.67V6.75c0-.1-.05-.18-.13-.22l-.06-.02-.06-.01H14.5V5c0-.82-.67-1.5-1.5-1.5Z"/></svg>`,
      // CloudFlow24Regular
      flows:     `<svg ${s}><path d="M7.5 7.79a4.5 4.5 0 0 1 9 0c.01.4.34.71.74.71h.26a3 3 0 0 1 2.99 2.7c.56.2 1.06.53 1.46.95a4.5 4.5 0 0 0-4.03-5.13 6 6 0 0 0-11.84 0A4.5 4.5 0 0 0 6.5 16h6.68l.13-.5a3 3 0 0 1 .47-1H6.5a3 3 0 1 1 0-6h.26c.4 0 .73-.31.75-.71Zm11.75 5.71a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm-3.03 2.25h.47a2.75 2.75 0 1 0-.14-1.5h-.33a2 2 0 0 0-1.94 1.5l-1.01 3.88a.5.5 0 0 1-.49.37h-.8a2.75 2.75 0 1 0-.28 1.5h1.08a2 2 0 0 0 1.94-1.5l1.01-3.88a.5.5 0 0 1 .49-.37ZM8 20.25a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0Z"/></svg>`,
      // ClipboardTaskListLtr24Regular
      'business-rules': `<svg ${s}><path d="M12.5 10.25c0-.41.34-.75.75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Zm.75 4.75a.75.75 0 1 0 0 1.5h3.5a.75.75 0 1 0 0-1.5h-3.5Zm-2.47-5.22a.75.75 0 1 0-1.06-1.06l-1.47 1.47-.47-.47a.75.75 0 0 0-1.06 1.06l1 1c.3.3.77.3 1.06 0l2-2Zm0 4.44c.3.3.3.77 0 1.06l-2 2c-.3.3-.77.3-1.06 0l-1-1a.75.75 0 1 1 1.06-1.06l.47.47 1.47-1.47c.3-.3.77-.3 1.06 0Zm5.21-10.14A2.25 2.25 0 0 0 13.75 2h-3.5c-1.16 0-2.11.87-2.24 2H6.25C5.01 4 4 5 4 6.25v13.5C4 20.99 5 22 6.25 22h11.5c1.24 0 2.25-1 2.25-2.25V6.25C20 5.01 19 4 17.75 4h-1.76v.08Zm0 .02.01.15V4.1Zm-5.74 2.4h3.5c.78 0 1.47-.4 1.87-1h2.13c.41 0 .75.34.75.75v13.5c0 .41-.34.75-.75.75H6.25a.75.75 0 0 1-.75-.75V6.25c0-.41.34-.75.75-.75h2.13c.4.6 1.09 1 1.87 1Zm0-3h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Z"/></svg>`,
      // ClipboardSettings24Regular — matches Microsoft's "Processes" icon
      'classic-workflows': `<svg ${s}><path d="M13.75 2c1.16 0 2.11.87 2.24 2h1.76C18.99 4 20 5 20 6.25v5.25c-.47-.2-.98-.34-1.5-.42V6.25a.75.75 0 0 0-.75-.75h-2.13c-.4.6-1.09 1-1.87 1h-3.5c-.78 0-1.47-.4-1.87-1H6.25a.75.75 0 0 0-.75.75v13.5c0 .41.34.75.75.75h5.48c.29.55.65 1.06 1.08 1.5H6.25C5.01 22 4 21 4 19.75V6.25C4 5.01 5 4 6.25 4h1.76c.13-1.13 1.08-2 2.24-2h3.5Zm2.24 2.03V4v.03Zm0 .07.01.15v-.17.02Zm-2.24-.6h-3.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5Zm.53 10.48a2 2 0 0 1-1.44 2.5l-.59.14a5.73 5.73 0 0 0 0 1.8l.55.13a2 2 0 0 1 1.45 2.51l-.19.64c.44.38.94.7 1.49.92l.49-.52a2 2 0 0 1 2.9 0l.5.52a5.28 5.28 0 0 0 1.48-.91l-.2-.69a2 2 0 0 1 1.44-2.5l.59-.14a5.73 5.73 0 0 0 0-1.8l-.55-.13a2 2 0 0 1-1.45-2.51l.19-.63c-.44-.4-.94-.7-1.49-.93l-.49.52a2 2 0 0 1-2.9 0l-.5-.52c-.54.22-1.04.53-1.48.9l.2.7ZM17.5 19c-.8 0-1.45-.67-1.45-1.5S16.7 16 17.5 16c.8 0 1.45.67 1.45 1.5S18.3 19 17.5 19Z"/></svg>`,
      // Flowchart24Regular
      'business-process-flows': `<svg ${s}><path d="M5.25 3C4 3 3 4 3 5.25v2.5C3 9 4 10 5.25 10h.5v3.71c-.05.03-.1.07-.13.12l-2.8 2.79a1.25 1.25 0 0 0 0 1.77l2.8 2.79c.48.49 1.28.49 1.76 0l2.8-2.8.11-.13H14v.5C14 20 15.01 21 16.25 21h2.5c1.24 0 2.25-1 2.25-2.25v-2.5c0-1.24-1-2.25-2.25-2.25h-2.5C15.01 14 14 15 14 16.25v.5H10.3c-.03-.05-.07-.09-.12-.13l-2.79-2.8a1.26 1.26 0 0 0-.13-.11v-3.7h.5C9 10 10 9 10 7.74v-2.5C10 4 9 3 7.75 3h-2.5ZM4.5 5.25c0-.42.33-.75.75-.75h2.5c.42 0 .75.33.75.75v2.5c0 .42-.33.75-.75.75h-2.5a.75.75 0 0 1-.75-.75v-2.5ZM4.06 17.5l2.44-2.44 2.44 2.44-2.44 2.44-2.44-2.44Zm12.2-2h2.49c.41 0 .75.34.75.75v2.5c0 .42-.34.75-.75.75h-2.5a.75.75 0 0 1-.75-.75v-2.5c0-.41.34-.75.75-.75Z"/></svg>`,
      // DocumentGlobe24Regular — matches Microsoft's "Web resources" icon
      'web-resources': `<svg ${s}><path d="M4 4c0-1.1.9-2 2-2h6.17a2 2 0 0 1 1.42.59L19.4 8.4A2 2 0 0 1 20 9.83V20a2 2 0 0 1-2 2h-6.81c.43-.44.8-.95 1.08-1.5H18a.5.5 0 0 0 .5-.5V10H14a2 2 0 0 1-2-2V3.5H6a.5.5 0 0 0-.5.5v7.08c-.52.08-1.03.22-1.5.42V4Zm10 4.5h3.38L13.5 4.62V8c0 .28.22.5.5.5Zm-8.44 4.92c-.3.91-.51 2.17-.55 3.58h2.98a12.92 12.92 0 0 0-.55-3.58c-.17-.52-.36-.9-.55-1.14-.2-.25-.33-.28-.39-.28s-.2.03-.39.28c-.19.24-.38.62-.55 1.14Zm-.58-1.2c-.14.26-.26.56-.37.88-.34 1.03-.56 2.4-.6 3.9H1.02a5.5 5.5 0 0 1 3.96-4.79Zm3.4.88c-.1-.32-.22-.62-.36-.89A5.5 5.5 0 0 1 11.98 17H8.99c-.04-1.5-.26-2.87-.6-3.9Zm3.6 4.9H8.99c-.04 1.5-.26 2.87-.6 3.9-.1.32-.23.62-.37.89A5.5 5.5 0 0 0 11.98 18Zm-5.1 4.72c-.19.25-.32.28-.38.28s-.2-.03-.39-.28a3.84 3.84 0 0 1-.55-1.14c-.3-.91-.51-2.17-.55-3.58h2.98a12.92 12.92 0 0 1-.55 3.58c-.17.52-.36.9-.55 1.14Zm-1.9.07A5.5 5.5 0 0 1 1.02 18h2.99c.04 1.5.26 2.87.6 3.9.1.32.23.62.37.89Z"/></svg>`,
      // FlashSettings24Regular — lightning bolt + gear for Custom APIs
      'custom-apis': `<svg ${s}><path d="M7.42 2.83C7.6 2.33 8.07 2 8.6 2h6.46c.85 0 1.45.84 1.18 1.65L14.8 8h3.96c1.1 0 1.66 1.33.9 2.12l-.96.99a6.53 6.53 0 0 0-2.04-.06l1.5-1.55h-4.4a.75.75 0 0 1-.71-.99L14.7 3.5H8.78l-3.26 9.16c-.06.16.06.33.23.33l2.5.01a.75.75 0 0 1 .73.91L7.51 20.5l3.52-3.63a6.57 6.57 0 0 0 .12 2.03l-2.56 2.65c-1.06 1.08-2.88.1-2.55-1.38l1.27-5.66-1.57-.01c-1.2 0-2.04-1.2-1.64-2.34l3.32-9.32Zm6.86 11.15a2 2 0 0 1-1.44 2.5l-.59.14a5.73 5.73 0 0 0 0 1.8l.55.13a2 2 0 0 1 1.45 2.51l-.19.64c.44.38.94.7 1.49.92l.49-.52a2 2 0 0 1 2.9 0l.5.52a5.28 5.28 0 0 0 1.48-.9l-.2-.7a2 2 0 0 1 1.44-2.5l.59-.14a5.73 5.73 0 0 0-.01-1.8l-.54-.13a2 2 0 0 1-1.45-2.51l.19-.63c-.44-.39-.94-.7-1.49-.93l-.49.52a2 2 0 0 1-2.9 0l-.5-.52c-.54.22-1.04.53-1.48.91l.2.69ZM17.5 19c-.8 0-1.45-.67-1.45-1.5S16.7 16 17.5 16c.8 0 1.45.67 1.45 1.5S18.3 19 17.5 19Z"/></svg>`,
      // BracesVariable24Regular — {x} variable box matches Microsoft's Environment Variables icon
      'environment-variables': `<svg ${s}><path d="M3.5 5.75A2.75 2.75 0 0 1 6.25 3a.75.75 0 0 1 0 1.5C5.56 4.5 5 5.06 5 5.75v4.3c0 .75-.3 1.45-.8 1.95.5.5.8 1.2.8 1.94v4.31c0 .69.56 1.25 1.25 1.25a.75.75 0 0 1 0 1.5 2.75 2.75 0 0 1-2.75-2.75v-4.3c0-.55-.34-1.02-.85-1.2l-.14-.04a.75.75 0 0 1 0-1.42l.14-.05c.5-.17.85-.64.85-1.18V5.75Zm17 0A2.75 2.75 0 0 0 17.75 3a.75.75 0 0 0 0 1.5c.69 0 1.25.56 1.25 1.25v4.3c0 .75.3 1.45.8 1.95-.5.5-.8 1.2-.8 1.94v4.31c0 .69-.56 1.25-1.25 1.25a.75.75 0 0 0 0 1.5 2.75 2.75 0 0 0 2.75-2.75v-4.3c0-.55.34-1.02.85-1.2l.14-.04a.75.75 0 0 0 0-1.42l-.14-.05a1.25 1.25 0 0 1-.85-1.18V5.75ZM9.1 7.04a.75.75 0 1 0-1.2.92L11.06 12l-3.14 4.04a.75.75 0 0 0 1.18.92L12 13.22l2.9 3.74a.75.75 0 0 0 1.2-.92L12.94 12l3.14-4.04a.75.75 0 0 0-1.18-.92L12 10.78 9.1 7.04Z"/></svg>`,
      // PlugDisconnected24Regular — angled disconnected plug matches Microsoft's Custom Connectors icon
      'custom-connectors': `<svg ${s}><path d="M21.78 3.28a.75.75 0 0 0-1.06-1.06l-2.01 2.01a4.25 4.25 0 0 0-5.47.46l-1.06 1.07c-.69.69-.69 1.8 0 2.48l3.58 3.58c.69.69 1.8.69 2.48 0l1.07-1.06a4.25 4.25 0 0 0 .46-5.47l2.01-2.01Zm-3.59 2.48.03.02.02.03a2.75 2.75 0 0 1 0 3.88l-1.06 1.07c-.1.1-.26.1-.36 0l-3.58-3.58a.25.25 0 0 1 0-.36l1.07-1.06a2.75 2.75 0 0 1 3.88 0Zm-7.41 5.52a.75.75 0 1 0-1.06-1.06L8 11.94l-.47-.47a.75.75 0 0 0-1.06 0l-1.78 1.77a4.25 4.25 0 0 0-.46 5.47l-2.01 2.01a.75.75 0 1 0 1.06 1.06l2.01-2.01a4.25 4.25 0 0 0 5.47-.46l1.77-1.78c.3-.3.3-.77 0-1.06l-.47-.47 1.72-1.72a.75.75 0 1 0-1.06-1.06L11 14.94 9.06 13l1.72-1.72Zm-3.31 2.25 3 3 .47.47-1.25 1.24a2.75 2.75 0 0 1-3.88 0l-.05-.05a2.75 2.75 0 0 1 0-3.88L7 13.06l.47.47Z"/></svg>`,
      // AppsList24Regular — apps list matches Canvas Apps
      'canvas-apps': `<svg ${s}><path d="M6.25 16C7.2 16 8 16.8 8 17.75v2.5C8 21.22 7.2 22 6.25 22h-2.5C2.78 22 2 21.22 2 20.25v-2.5C2 16.8 2.78 16 3.75 16h2.5Zm0 1.5h-2.5a.25.25 0 0 0-.25.25v2.5c0 .14.11.25.25.25h2.5c.14 0 .25-.11.25-.25v-2.5a.25.25 0 0 0-.25-.25Zm3.5.5h11.5a.75.75 0 0 1 .1 1.5H9.75a.75.75 0 0 1-.1-1.5h11.6-11.5Zm-3.5-9C7.2 9 8 9.78 8 10.75v2.5C8 14.22 7.2 15 6.25 15h-2.5C2.78 15 2 14.22 2 13.25v-2.5C2 9.78 2.78 9 3.75 9h2.5Zm0 1.5h-2.5a.25.25 0 0 0-.25.25v2.5c0 .14.11.25.25.25h2.5c.14 0 .25-.11.25-.25v-2.5a.25.25 0 0 0-.25-.25Zm3.5.5h11.5a.75.75 0 0 1 .1 1.5H9.75a.75.75 0 0 1-.1-1.5h11.6-11.5Zm-3.5-9C7.2 2 8 2.78 8 3.75v2.5C8 7.2 7.2 8 6.25 8h-2.5C2.78 8 2 7.2 2 6.25v-2.5C2 2.78 2.78 2 3.75 2h2.5Zm0 1.5h-2.5a.25.25 0 0 0-.25.25v2.5c0 .14.11.25.25.25h2.5c.14 0 .25-.11.25-.25v-2.5a.25.25 0 0 0-.25-.25Zm3.5.5h11.5a.75.75 0 0 1 .1 1.5H9.75a.75.75 0 0 1-.1-1.5h11.6-11.5Z"/></svg>`,
      // DocumentEdit24Regular — document + pencil matches Custom Pages
      'custom-pages': `<svg ${s}><path d="M6.25 3.5a.75.75 0 0 0-.75.75v15.5c0 .41.34.75.75.75h3.78c-.1.55 0 1.07.27 1.5H6.25C5.01 22 4 21 4 19.75V4.25C4 3.01 5 2 6.25 2h6.09c.46 0 .9.18 1.23.51l5.92 5.92c.33.32.51.77.51 1.23V10h-6a2 2 0 0 1-2-2V3.5H6.25Zm7.25 1.06V8c0 .28.22.5.5.5h3.44L13.5 4.56ZM19.71 11a2.28 2.28 0 0 1 1.62 3.9l-5.9 5.9c-.35.35-.78.6-1.25.71l-1.83.46c-.8.2-1.52-.52-1.32-1.32l.46-1.83c.12-.47.36-.9.7-1.25l5.9-5.9a2.28 2.28 0 0 1 1.62-.67Z"/></svg>`,
      // AppGeneric24Regular — generic app icon for Model-Driven Apps
      'model-driven-apps': `<svg ${s}><path d="M3 6.25C3 4.45 4.46 3 6.25 3h11.5C19.55 3 21 4.46 21 6.25v11.5c0 1.8-1.46 3.25-3.25 3.25H6.25A3.25 3.25 0 0 1 3 17.75V6.25ZM6.25 4.5c-.97 0-1.75.78-1.75 1.75v.25h15v-.25c0-.97-.78-1.75-1.75-1.75H6.25ZM4.5 17.75c0 .97.78 1.75 1.75 1.75h11.5c.97 0 1.75-.78 1.75-1.75V8h-15v9.75ZM6.85 9.5h3.3c.47 0 .85.38.85.85v6.8c0 .47-.38.85-.85.85h-3.3a.85.85 0 0 1-.85-.85v-6.8c0-.47.38-.85.85-.85Zm.65 7h2V11h-2v5.5Zm4.5-6.25c0-.41.34-.75.75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z"/></svg>`,
      // NumberSymbolSquare24Regular — numbered list in a box matches Microsoft's Option Sets icon
      'global-choices': `<svg ${s}><path d="M6.25 3A3.25 3.25 0 0 0 3 6.25v11.5C3 19.55 4.46 21 6.25 21h11.5c1.8 0 3.25-1.46 3.25-3.25V6.25C21 4.45 19.54 3 17.75 3H6.25ZM4.5 6.25c0-.97.78-1.75 1.75-1.75h11.5c.97 0 1.75.78 1.75 1.75v11.5c0 .97-.78 1.75-1.75 1.75H6.25A1.75 1.75 0 0 1 4.5 17.75V6.25ZM9 8.75a.75.75 0 0 0-1.5 0v1H7a.75.75 0 0 0 0 1.5h.5v4.75a.75.75 0 0 0 1.5 0v-7Zm5.25.75a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-3.44l-.22.22a.75.75 0 1 1-1.06-1.06l1.5-1.5c.2-.2.48-.28.75-.22.17.04.32.13.44.25H14Zm-2 5.75a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z"/></svg>`,
      // UsbPlug24Regular — vertical USB/plug connector matches Microsoft's Connection References icon
      'connection-references': `<svg ${s}><path d="M11 21.25a.75.75 0 0 1-1.5.1V17h-.75c-1.19 0-2.16-.93-2.24-2.1V9.25c0-.98.63-1.82 1.5-2.13V2.75c0-.38.29-.7.65-.75h6.6c.39 0 .7.28.75.65V7.13c.82.3 1.42 1.05 1.49 1.95v5.67c0 1.2-.92 2.17-2.1 2.24l-.15.01h-.75v4.25a.75.75 0 0 1-1.5.1V17h-2v4.25ZM15.25 8.5h-6.5c-.38 0-.69.28-.74.65v5.6c0 .38.28.7.64.74l.1.01h6.5c.38 0 .7-.28.75-.65v-5.6c0-.38-.28-.7-.64-.74l-.1-.01Zm-.73-5h-5V7h5V3.5Z"/></svg>`,
      // PeopleLock24Regular — two people + lock badge matches Microsoft's Security Roles icon
      security:  `<svg ${s}><path d="M8 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM4 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm13-.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM14 8a3 3 0 1 1 4.45 2.63 3.5 3.5 0 0 0-2.44.2A3 3 0 0 1 14 8Zm-.3 6.13A2.25 2.25 0 0 0 11.75 13h-7.5C3.01 13 2 14 2 15.25v.28a2.07 2.07 0 0 0 .01.2c.02.14.04.32.1.53.09.42.29.98.68 1.55C3.61 18.97 5.17 20 8 20c1.8 0 3.1-.42 4-1.02V16.9l-.02.03c-.5.71-1.56 1.56-3.98 1.56s-3.49-.85-3.98-1.56a2.99 2.99 0 0 1-.52-1.43v-.26c0-.41.34-.75.75-.75h7.5c.34 0 .63.23.72.54.3-.42.73-.74 1.23-.91Zm.8.87h.5v-1a2.5 2.5 0 0 1 5 0v1h.5c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5Zm2-1v1h2v-1a1 1 0 1 0-2 0Zm2 5a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z"/></svg>`,
      // Globe24Regular — globe = "the internet / external world" for External Dependencies
      'external-dependencies': `<svg ${s}><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm2.94 14.5H9.06c.65 2.41 1.79 4 2.94 4s2.29-1.59 2.94-4Zm-7.43 0H4.79a8.53 8.53 0 0 0 4.09 3.41c-.52-.82-.95-1.85-1.27-3.02l-.1-.39Zm11.7 0H16.5c-.32 1.33-.79 2.5-1.37 3.41a8.53 8.53 0 0 0 3.9-3.13l.2-.28ZM7.1 10H3.74v.02a8.52 8.52 0 0 0 .3 4.98h3.18a20.3 20.3 0 0 1-.13-5Zm8.3 0H8.6a18.97 18.97 0 0 0 .14 5h6.52a18.5 18.5 0 0 0 .14-5Zm4.87 0h-3.35a20.85 20.85 0 0 1-.13 5h3.18a8.48 8.48 0 0 0 .3-5ZM8.88 4.09h-.02a8.53 8.53 0 0 0-4.61 4.4l3.05.01c.31-1.75.86-3.28 1.58-4.41Zm3.12-.6-.12.01c-1.26.12-2.48 2.12-3.05 5h6.34c-.56-2.87-1.78-4.87-3.04-5H12Zm3.12.6.1.17A12.64 12.64 0 0 1 16.7 8.5h3.05a8.53 8.53 0 0 0-4.34-4.29l-.29-.12Z"/></svg>`,
      // ArrowBetweenDown24Regular — downward arrows between bars
      'cross-entity': `<svg ${s}><path d="M6 1.75a.75.75 0 0 0-1.5 0v.5c0 1.24 1 2.25 2.25 2.25h10c1.24 0 2.25-1 2.25-2.25v-.5a.75.75 0 0 0-1.5 0v.5c0 .41-.34.75-.75.75h-10A.75.75 0 0 1 6 2.25v-.5ZM11.75 6c.41 0 .75.34.75.75v8.69l3.72-3.72a.75.75 0 1 1 1.06 1.06l-5 5c-.3.3-.77.3-1.06 0l-5-5a.75.75 0 1 1 1.06-1.06L11 15.44V6.75c0-.41.34-.75.75-.75ZM4.5 21.75c0-1.24 1-2.25 2.25-2.25h10c1.24 0 2.25 1 2.25 2.25v.5a.75.75 0 0 1-1.5 0v-.5a.75.75 0 0 0-.75-.75h-10a.75.75 0 0 0-.75.75v.5a.75.75 0 0 1-1.5 0v-.5Z"/></svg>`,
      // Simple printer icon (hand-crafted — no matching Fluent UI component icon needed)
      print:     `<svg ${s}><path d="M7 3h10a1 1 0 0 1 1 1v4H6V4a1 1 0 0 1 1-1ZM5 8h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Zm2 9v2h10v-2H7Zm-2-4a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" fill-rule="evenodd"/></svg>`,
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
    return `    /* Skip navigation link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #0078d4;
      color: #ffffff;
      padding: 8px 16px;
      z-index: 1000;
      text-decoration: none;
      font-weight: 600;
      border-radius: 0 0 4px 0;
    }
    .skip-link:focus {
      top: 0;
    }

    /* Base styles */
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

    .alert-danger {
      background: #fde7e9;
      border-left: 4px solid #d13438;
      color: #6e0811;
    }

    .stats-value-danger {
      color: #d13438;
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

    // Cross-entity "show all entities with automation" toggle
    function toggleCeaAllEntities(showAll) {
      document.querySelectorAll('.cea-entity-no-output').forEach(function(el) {
        el.style.display = showAll ? '' : 'none';
      });
    }

    // Accordion toggle
    function toggleAccordion(id) {
      const content = document.getElementById(id);
      const icon = document.getElementById('icon-' + id);
      const header = document.querySelector('[aria-controls="' + id + '"]');

      if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        icon.textContent = '−';
        if (header) header.setAttribute('aria-expanded', 'true');
      } else {
        content.style.display = 'none';
        icon.textContent = '+';
        if (header) header.setAttribute('aria-expanded', 'false');
      }
    }

    // Accordion keyboard handler
    function accordionKeydown(event, id) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleAccordion(id);
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
      <section id="security" class="content-section" aria-labelledby="heading-security">
        <h2 id="heading-security" class="section-title" style="display:flex;align-items:center;gap:10px;">${this.navIcon('security')} Security</h2>
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
              <div class="accordion">
                <div class="accordion-item">
                  <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="special-perms-matrix" onclick="toggleAccordion('special-perms-matrix')" onkeydown="accordionKeydown(event,'special-perms-matrix')">
                    <span class="accordion-icon" id="icon-special-perms-matrix">+</span>
                    <h4 style="margin:0">Special Permissions Matrix</h4>
                    <span style="font-size:0.85em;color:#666;margin-left:auto">Roles with miscellaneous permissions — click to expand</span>
                  </div>
                  <div class="accordion-content" id="special-perms-matrix" style="display:none;padding:12px 0;">
                    <p>This table shows which security roles have special/miscellaneous permissions.</p>
                    ${this.generateSpecialPermissionsTable(securityRoles)}
                  </div>
                </div>
              </div>
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
            <th scope="col">Role Name</th>
            <th scope="col">Business Unit</th>`;

    for (const key of specialPermissionKeys) {
      html += `<th scope="col">${this.formatSpecialPermissionName(key)}</th>`;
    }

    html += `
          </tr>
        </thead>
        <tbody>`;

    // Only include roles that have at least one special permission set
    const rolesWithPerms = securityRoles.filter(role =>
      specialPermissionKeys.some(key => role.specialPermissions[key])
    );

    if (rolesWithPerms.length === 0) {
      return '<p style="color:#666">No roles have special/miscellaneous permissions set.</p>';
    }

    for (const role of rolesWithPerms) {
      html += `
          <tr>
            <td><strong>${this.htmlEscape(role.name)}</strong></td>
            <td>${this.htmlEscape(role.businessunitname || 'Unknown')}</td>`;

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
          <div class="accordion-header" role="button" tabindex="0" aria-expanded="false" aria-controls="role-${i}" onclick="toggleAccordion('role-${i}')" onkeydown="accordionKeydown(event,'role-${i}')">
            <span class="accordion-icon" id="icon-role-${i}">+</span>
            <div class="accordion-title">
              <strong>${this.htmlEscape(role.name)}</strong>
              <span class="badge">${role.totalEntities} entities</span>
              ${role.hasSystemAdminPrivileges ? '<span class="badge badge-warning">System Admin</span>' : ''}
              ${role.ismanaged ? '<span class="badge badge-info">Managed</span>' : ''}
            </div>
          </div>
          <div class="accordion-content" id="role-${i}" style="display: none;">
            <p><strong>Business Unit:</strong> ${this.htmlEscape(role.businessunitname || 'Unknown')}</p>
            ${role.description ? `<p><strong>Description:</strong> ${this.htmlEscape(role.description)}</p>` : ''}

            <h5>Entity Permissions</h5>
            ${this.generateEntityPermissionsTable(role.entityPermissions)}
          </div>
        </div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Map Dataverse privilege depth strings to Power Platform UI terminology.
   */
  private privDepthLabel(depth: string): string {
    switch (depth) {
      case 'Basic':  return 'User';
      case 'Local':  return 'BU';
      case 'Deep':   return 'P:CBU';
      case 'Global': return 'Org';
      default:       return this.htmlEscape(depth);
    }
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
            <th scope="col">Entity</th>
            <th scope="col">Create</th>
            <th scope="col">Read</th>
            <th scope="col">Write</th>
            <th scope="col">Delete</th>
            <th scope="col">Append</th>
            <th scope="col">AppendTo</th>
            <th scope="col">Assign</th>
            <th scope="col">Share</th>
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
            <td><strong>${this.htmlEscape(entityPerm.entityLogicalName)}</strong></td>`;

      for (const type of ['Create', 'Read', 'Write', 'Delete', 'Append', 'AppendTo', 'Assign', 'Share']) {
        const priv = privMap.get(type as PrivilegeDetail['type']);
        const label = priv ? this.privDepthLabel(priv.depth) : '';
        html += `<td class="center">${label}</td>`;
      }

      html += `</tr>`;
    }

    html += `
        </tbody>
      </table>
      <p class="legend"><strong>Access levels:</strong> User = own records · BU = Business Unit · P:CBU = Parent &amp; Child BUs · Org = Organisation-wide</p>`;

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
            <th scope="col">Profile Name</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>`;

    for (const profile of fieldSecurityProfiles) {
      html += `
          <tr>
            <td><strong>${this.htmlEscape(profile.name)}</strong></td>
            <td>${profile.description ? this.htmlEscape(profile.description) : '<em>No description</em>'}</td>
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
            <th scope="col">Entity</th>
            <th scope="col">Attribute</th>
            <th scope="col">Masking Rule</th>
            <th scope="col">Managed</th>
          </tr>
        </thead>
        <tbody>`;

    for (const rule of attributeMaskingRules) {
      html += `
          <tr>
            <td><strong>${this.htmlEscape(rule.entitylogicalname)}</strong></td>
            <td>${this.htmlEscape(rule.attributelogicalname)}</td>
            <td><span class="badge">${this.htmlEscape(rule.maskingRuleName)}</span></td>
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
            <th scope="col">Profile Name</th>
            <th scope="col">Description</th>
            <th scope="col">Managed</th>
          </tr>
        </thead>
        <tbody>`;

    for (const profile of columnSecurityProfiles) {
      html += `
          <tr>
            <td><strong>${this.htmlEscape(profile.name)}</strong></td>
            <td>${profile.description ? this.htmlEscape(profile.description) : '<em>No description</em>'}</td>
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
              <th scope="col">Field</th>
              <th scope="col">Profiles with Access</th>
            </tr>
          </thead>
          <tbody>`;

    for (const securedField of fieldSecurity.securedFields) {
      const profileDetails = securedField.profiles.map(p => {
        const permissions = [];
        if (p.canRead) permissions.push('R');
        if (p.canCreate) permissions.push('C');
        if (p.canUpdate) permissions.push('U');
        return `<div class="profile-badge">${this.htmlEscape(p.profileName)} <span class="permissions">(${permissions.join(', ')})</span></div>`;
      }).join('');

      html += `
            <tr>
              <td><strong>${this.htmlEscape(securedField.attributeLogicalName)}</strong></td>
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

}
