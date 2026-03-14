import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class CustomAPIsSection implements IHtmlTemplateSection {
  readonly key = 'customAPIs';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.customAPIs.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlCustomAPIsTable(result.customAPIs); }
}
