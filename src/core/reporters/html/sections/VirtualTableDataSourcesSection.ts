import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class VirtualTableDataSourcesSection implements IHtmlTemplateSection {
  readonly key = 'virtualTableDataSources';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.virtualTableDataSources.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlVirtualTableDataSourcesTable(result.virtualTableDataSources); }
}
