import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class FlowsSection implements IHtmlTemplateSection {
  readonly key = 'flows';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.flows.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlFlowsTable(result.flows); }
}
