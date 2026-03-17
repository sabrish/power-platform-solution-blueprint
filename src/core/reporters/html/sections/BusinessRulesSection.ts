import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class BusinessRulesSection implements IHtmlTemplateSection {
  readonly key = 'businessRules';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.businessRules.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlBusinessRulesTable(result.businessRules); }
}
