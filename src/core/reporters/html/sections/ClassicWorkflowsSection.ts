import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ClassicWorkflowsSection implements IHtmlTemplateSection {
  readonly key = 'classicWorkflows';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.classicWorkflows.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlClassicWorkflowsTable(result.classicWorkflows); }
}
