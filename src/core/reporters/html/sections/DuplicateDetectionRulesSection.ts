import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class DuplicateDetectionRulesSection implements IHtmlTemplateSection {
  readonly key = 'duplicateDetectionRules';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.duplicateDetectionRules.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlDuplicateDetectionRulesTable(result.duplicateDetectionRules); }
}
