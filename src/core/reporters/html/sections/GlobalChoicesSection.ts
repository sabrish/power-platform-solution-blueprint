import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class GlobalChoicesSection implements IHtmlTemplateSection {
  readonly key = 'globalChoices';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.globalChoices.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlGlobalChoicesTable(result.globalChoices); }
}
