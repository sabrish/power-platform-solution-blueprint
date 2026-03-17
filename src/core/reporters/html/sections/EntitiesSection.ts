import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class EntitiesSection implements IHtmlTemplateSection {
  readonly key = 'entities';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.entities.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlEntitiesAccordion(result.entities); }
}
