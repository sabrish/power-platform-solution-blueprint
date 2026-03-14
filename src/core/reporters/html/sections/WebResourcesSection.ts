import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class WebResourcesSection implements IHtmlTemplateSection {
  readonly key = 'webResources';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.webResources.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlWebResourcesTable(result.webResources); }
}
