import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ConnectionReferencesSection implements IHtmlTemplateSection {
  readonly key = 'connectionReferences';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.connectionReferences.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlConnectionReferencesTable(result.connectionReferences); }
}
