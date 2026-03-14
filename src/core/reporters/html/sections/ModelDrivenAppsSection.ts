import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ModelDrivenAppsSection implements IHtmlTemplateSection {
  readonly key = 'modelDrivenApps';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.modelDrivenApps.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlModelDrivenAppsTable(result.modelDrivenApps); }
}
