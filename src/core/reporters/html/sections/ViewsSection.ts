import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ViewsSection implements IHtmlTemplateSection {
  readonly key = 'views';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.views.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlViewsTable(result.views); }
}
