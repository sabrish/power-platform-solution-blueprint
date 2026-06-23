import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class SharedComponentsSection implements IHtmlTemplateSection {
  readonly key = 'shared-components';
  private readonly templates = new HtmlTemplates();

  hasContent(result: BlueprintResult): boolean {
    // Only render if at least one component appears in 2+ solutions
    const hasShared = (items: Array<{ referencingSolutions?: string[] }>) =>
      items.some(i => (i.referencingSolutions?.length ?? 0) > 1);

    return (
      hasShared(result.flows) ||
      hasShared(result.businessRules) ||
      hasShared(result.plugins) ||
      hasShared(result.webResources) ||
      hasShared(result.classicWorkflows) ||
      hasShared(result.businessProcessFlows) ||
      hasShared(result.customAPIs) ||
      hasShared(result.environmentVariables) ||
      hasShared(result.connectionReferences) ||
      hasShared(result.canvasApps) ||
      hasShared(result.customPages) ||
      hasShared(result.modelDrivenApps) ||
      hasShared(result.entities)
    );
  }

  render(result: BlueprintResult): string {
    return this.templates.htmlSharedComponentsSection(result);
  }
}
