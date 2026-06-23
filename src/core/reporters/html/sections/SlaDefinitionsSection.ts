import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class SlaDefinitionsSection implements IHtmlTemplateSection {
  readonly key = 'slaDefinitions';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.slaDefinitions.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlSlaDefinitionsTable(result.slaDefinitions); }
}
