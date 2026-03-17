import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class BusinessProcessFlowsSection implements IHtmlTemplateSection {
  readonly key = 'businessProcessFlows';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.businessProcessFlows.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlBusinessProcessFlowsTable(result.businessProcessFlows); }
}
