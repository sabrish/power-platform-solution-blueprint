import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class CustomConnectorsSection implements IHtmlTemplateSection {
  readonly key = 'customConnectors';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.customConnectors.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlCustomConnectorsTable(result.customConnectors); }
}
