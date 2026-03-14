/**
 * HTML Reporter - Generates single-page interactive HTML blueprint
 *
 * Features:
 * - Self-contained HTML file (no external dependencies except Mermaid CDN)
 * - Sidebar navigation with smooth scrolling
 * - Interactive accordion for entities
 * - Sortable tables
 * - Responsive design (mobile-friendly)
 * - Print-optimized styles
 * - Professional Fluent UI-inspired design
 *
 * Use cases:
 * - Sharing with stakeholders (single HTML file)
 * - Offline viewing
 * - Presentation mode
 * - Documentation website
 * - Quick review and navigation
 */
import type { BlueprintResult } from '../types/blueprint.js';
import { HtmlTemplates } from './html/HtmlTemplates.js';
import { HTML_TEMPLATE_SECTIONS } from './html/sections/index.js';
import type { IReporter } from './IReporter.js';

export class HtmlReporter implements IReporter<string> {
  private readonly templates: HtmlTemplates;

  constructor() {
    this.templates = new HtmlTemplates();
  }

  /**
   * Generate complete HTML blueprint document.
   *
   * Structural wrappers (head, nav, header, footer, scripts) are rendered directly.
   * Content sections are driven by the HTML_TEMPLATE_SECTIONS registry — each section
   * declares its own hasContent() guard and render() method.
   *
   * To add a new section: implement IHtmlTemplateSection and append to
   * src/core/reporters/html/sections/index.ts — no changes here required (Open/Closed).
   *
   * @param result Complete blueprint result
   * @returns Self-contained HTML string
   */
  generate(result: BlueprintResult): string {
    const head = this.templates.htmlHead(result);
    const nav = this.templates.htmlNavigation();
    const header = this.templates.htmlHeader(result.metadata);
    const footer = this.templates.htmlFooter();
    const scripts = this.templates.htmlScripts();

    const sectionHtml = HTML_TEMPLATE_SECTIONS
      .filter(s => s.hasContent(result))
      .map(s => s.render(result))
      .join('\n    ');

    return `<!DOCTYPE html>
<html lang="en">
${head}
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${nav}
  <main id="main-content">
    ${header}
    ${sectionHtml}
  </main>
  ${footer}
  ${scripts}
</body>
</html>`;
  }
}
