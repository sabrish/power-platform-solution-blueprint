import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class DialogsSection implements IHtmlTemplateSection {
  readonly key = 'dialogs';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.dialogs.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlDialogsTable(result.dialogs); }
}
