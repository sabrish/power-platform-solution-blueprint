import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ReportsSection implements IHtmlTemplateSection {
  readonly key = 'reports';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.reports.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlReportsTable(result.reports); }
}
