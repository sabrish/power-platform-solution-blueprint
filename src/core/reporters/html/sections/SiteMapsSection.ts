import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class SiteMapsSection implements IHtmlTemplateSection {
  readonly key = 'siteMaps';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.siteMaps.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlSiteMapsTable(result.siteMaps); }
}
