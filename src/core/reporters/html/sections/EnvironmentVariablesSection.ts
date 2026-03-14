import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class EnvironmentVariablesSection implements IHtmlTemplateSection {
  readonly key = 'environmentVariables';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.environmentVariables.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlEnvironmentVariablesTable(result.environmentVariables); }
}
