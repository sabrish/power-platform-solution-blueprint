/**
 * HTML Reporter - Generates single-page interactive HTML blueprint
 *
 * Features:
 * - Self-contained HTML file (no external dependencies except Mermaid CDN)
 * - Sidebar navigation with smooth scrolling
 * - Interactive accordion for entities
 * - Sortable tables
 * - Responsive design (mobile-friendly)
 * - Print-optimized styles
 * - Professional Fluent UI-inspired design
 *
 * Use cases:
 * - Sharing with stakeholders (single HTML file)
 * - Offline viewing
 * - Presentation mode
 * - Documentation website
 * - Quick review and navigation
 */
import type { BlueprintResult } from '../types/blueprint.js';
import { HtmlTemplates } from './html/HtmlTemplates.js';

export class HtmlReporter {
  private templates: HtmlTemplates;

  constructor() {
    this.templates = new HtmlTemplates();
  }

  /**
   * Generate complete HTML blueprint document
   * @param result Complete blueprint result
   * @returns Self-contained HTML string
   */
  generate(result: BlueprintResult): string {
    // Build all sections
    const head = this.templates.htmlHead(result);
    const nav = this.templates.htmlNavigation();
    const header = this.templates.htmlHeader(result.metadata);
    const summary = this.templates.htmlSummary(result.summary);
    const erd = this.templates.htmlErdSection(result.erd);
    const entities = this.templates.htmlEntitiesAccordion(result.entities);
    const plugins = this.templates.htmlPluginsTable(result.plugins);
    const flows = this.templates.htmlFlowsTable(result.flows);
    const businessRules = this.templates.htmlBusinessRulesTable(result.businessRules);
    const classicWorkflows = this.templates.htmlClassicWorkflowsTable(result.classicWorkflows);
    const businessProcessFlows = this.templates.htmlBusinessProcessFlowsTable(result.businessProcessFlows);
    const webResources = this.templates.htmlWebResourcesTable(result.webResources);
    const customAPIs = this.templates.htmlCustomAPIsTable(result.customAPIs);
    const environmentVariables = this.templates.htmlEnvironmentVariablesTable(result.environmentVariables);
    const connectionReferences = this.templates.htmlConnectionReferencesTable(result.connectionReferences);
    const externalDependencies = this.templates.htmlExternalDependenciesSection(result.externalEndpoints);
    const crossEntity = this.templates.htmlCrossEntitySection(result.crossEntityLinks);
    const security = this.templates.htmlSecuritySection(
      result.securityRoles,
      result.fieldSecurityProfiles,
      result.attributeMaskingRules,
      result.columnSecurityProfiles
    );
    const footer = this.templates.htmlFooter();
    const scripts = this.templates.htmlScripts();

    // Combine into complete HTML document
    return `<!DOCTYPE html>
<html lang="en">
${head}
<body>
  ${nav}
  <main>
    ${header}
    ${summary}
    ${erd}
    ${entities}
    ${plugins}
    ${flows}
    ${businessRules}
    ${classicWorkflows}
    ${businessProcessFlows}
    ${webResources}
    ${customAPIs}
    ${environmentVariables}
    ${connectionReferences}
    ${security}
    ${externalDependencies}
    ${crossEntity}
  </main>
  ${footer}
  ${scripts}
</body>
</html>`;
  }
}
