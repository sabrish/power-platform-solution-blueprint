import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class SummarySection implements IHtmlTemplateSection {
  readonly key = 'summary';
  private readonly templates = new HtmlTemplates();
  hasContent(_result: BlueprintResult): boolean { return true; }
  render(result: BlueprintResult): string { return this.templates.htmlSummary(result.summary); }
}
