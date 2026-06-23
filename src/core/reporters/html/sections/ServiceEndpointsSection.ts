import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ServiceEndpointsSection implements IHtmlTemplateSection {
  readonly key = 'serviceEndpoints';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.serviceEndpoints.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlServiceEndpointsTable(result.serviceEndpoints); }
}
