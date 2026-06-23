import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class PcfControlsSection implements IHtmlTemplateSection {
  readonly key = 'pcfControls';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.pcfControls.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlPcfControlsTable(result.pcfControls); }
}
