import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class CrossEntitySection implements IHtmlTemplateSection {
  readonly key = 'crossEntity';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return !!result.crossEntityAnalysis; }
  render(result: BlueprintResult): string { return this.templates.htmlCrossEntitySection(result.crossEntityAnalysis); }
}
