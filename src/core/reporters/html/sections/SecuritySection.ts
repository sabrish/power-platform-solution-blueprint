import type { BlueprintResult } from '../../../types/blueprint.js';
import type { IHtmlTemplateSection } from '../IHtmlTemplateSection.js';
import { HtmlTemplates } from '../HtmlTemplates.js';

export class SecuritySection implements IHtmlTemplateSection {
  readonly key = 'security';
  private readonly templates = new HtmlTemplates();
  hasContent(result: BlueprintResult): boolean {
    return !!(
      result.securityRoles?.length ||
      result.fieldSecurityProfiles?.length ||
      result.attributeMaskingRules?.length ||
      result.columnSecurityProfiles?.length
    );
  }
  render(result: BlueprintResult): string {
    return this.templates.htmlSecuritySection(
      result.securityRoles,
      result.fieldSecurityProfiles,
      result.attributeMaskingRules,
      result.columnSecurityProfiles
    );
  }
}
