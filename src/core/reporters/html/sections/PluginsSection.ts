import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class PluginsSection implements IHtmlTemplateSection {
  readonly key = 'plugins';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.plugins.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlPluginsTable(result.plugins); }
}
