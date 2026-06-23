import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class AiModelsSection implements IHtmlTemplateSection {
  readonly key = 'aiModels';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.aiModels.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlAiModelsTable(result.aiModels); }
}
