import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ChartsSection implements IHtmlTemplateSection {
  readonly key = 'charts';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.charts.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlChartsTable(result.charts); }
}
