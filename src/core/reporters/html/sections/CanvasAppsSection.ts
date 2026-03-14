import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class CanvasAppsSection implements IHtmlTemplateSection {
  readonly key = 'canvasApps';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.canvasApps.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlCanvasAppsTable(result.canvasApps); }
}
