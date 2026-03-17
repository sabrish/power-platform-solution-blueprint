import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class CustomPagesSection implements IHtmlTemplateSection {
  readonly key = 'customPages';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.customPages.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlCustomPagesTable(result.customPages); }
}
