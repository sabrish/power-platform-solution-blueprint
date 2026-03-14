import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ErdSection implements IHtmlTemplateSection {
  readonly key = 'erd';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return !!result.erd; }
  render(result: BlueprintResult): string { return this.templates.htmlErdSection(result.erd); }
}
