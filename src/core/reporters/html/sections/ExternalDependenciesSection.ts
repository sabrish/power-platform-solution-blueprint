import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class ExternalDependenciesSection implements IHtmlTemplateSection {
  readonly key = 'externalDependencies';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return !!(result.externalEndpoints?.length); }
  render(result: BlueprintResult): string { return this.templates.htmlExternalDependenciesSection(result.externalEndpoints); }
}
