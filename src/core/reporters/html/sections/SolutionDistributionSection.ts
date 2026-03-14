import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class SolutionDistributionSection implements IHtmlTemplateSection {
  readonly key = 'solutionDistribution';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return !!result.solutionDistribution; }
  render(result: BlueprintResult): string { return this.templates.htmlSolutionDistribution(result.solutionDistribution); }
}
