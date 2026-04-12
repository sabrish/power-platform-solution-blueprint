import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class CopilotAgentsSection implements IHtmlTemplateSection {
  readonly key = 'copilotAgents';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean { return result.copilotAgents.length > 0; }
  render(result: BlueprintResult): string { return this.templates.htmlCopilotAgentsTable(result.copilotAgents); }
}
