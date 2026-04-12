/**
 * Ordered registry of all HTML template sections.
 *
 * HtmlReporter.generate() iterates this array, calling hasContent() then render()
 * for each section. Sections that return false from hasContent() are skipped.
 *
 * To add a new component type:
 *   1. Create a new XxxSection.ts in this directory implementing IHtmlTemplateSection
 *   2. Import it below and append it to HTML_TEMPLATE_SECTIONS
 *   No changes to HtmlReporter.generate() are required.
 *
 * All imports are STATIC — dynamic import() is forbidden (PATTERN-007).
 */
import { SummarySection } from './SummarySection.js';
import { SolutionDistributionSection } from './SolutionDistributionSection.js';
import { ErdSection } from './ErdSection.js';
import { EntitiesSection } from './EntitiesSection.js';
import { PluginsSection } from './PluginsSection.js';
import { FlowsSection } from './FlowsSection.js';
import { BusinessRulesSection } from './BusinessRulesSection.js';
import { ClassicWorkflowsSection } from './ClassicWorkflowsSection.js';
import { BusinessProcessFlowsSection } from './BusinessProcessFlowsSection.js';
import { WebResourcesSection } from './WebResourcesSection.js';
import { CustomAPIsSection } from './CustomAPIsSection.js';
import { EnvironmentVariablesSection } from './EnvironmentVariablesSection.js';
import { ConnectionReferencesSection } from './ConnectionReferencesSection.js';
import { GlobalChoicesSection } from './GlobalChoicesSection.js';
import { CustomConnectorsSection } from './CustomConnectorsSection.js';
import { CanvasAppsSection } from './CanvasAppsSection.js';
import { CustomPagesSection } from './CustomPagesSection.js';
import { ModelDrivenAppsSection } from './ModelDrivenAppsSection.js';
import { SecuritySection } from './SecuritySection.js';
import { ExternalDependenciesSection } from './ExternalDependenciesSection.js';
import { CrossEntitySection } from './CrossEntitySection.js';
import { PcfControlsSection } from './PcfControlsSection.js';
import { ServiceEndpointsSection } from './ServiceEndpointsSection.js';
import { CopilotAgentsSection } from './CopilotAgentsSection.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';

export const HTML_TEMPLATE_SECTIONS: readonly IHtmlTemplateSection[] = [
  new SummarySection(),
  new SolutionDistributionSection(),
  new ErdSection(),
  new EntitiesSection(),
  new PluginsSection(),
  new FlowsSection(),
  new BusinessRulesSection(),
  new ClassicWorkflowsSection(),
  new BusinessProcessFlowsSection(),
  new WebResourcesSection(),
  new CustomAPIsSection(),
  new EnvironmentVariablesSection(),
  new ConnectionReferencesSection(),
  new GlobalChoicesSection(),
  new CustomConnectorsSection(),
  new CanvasAppsSection(),
  new CustomPagesSection(),
  new ModelDrivenAppsSection(),
  new PcfControlsSection(),
  new ServiceEndpointsSection(),
  new CopilotAgentsSection(),
  new SecuritySection(),
  new ExternalDependenciesSection(),
  new CrossEntitySection(),
];
