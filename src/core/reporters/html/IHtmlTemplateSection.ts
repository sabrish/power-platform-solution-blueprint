import type { BlueprintResult } from '../../types/blueprint.js';

/**
 * A single section of the HTML blueprint export.
 * Each section is responsible for rendering one component category.
 *
 * Registered in HtmlReporter via a static array — dynamic imports are forbidden (PATTERN-007).
 * To add a new component type: implement this interface and append to HTML_TEMPLATE_SECTIONS
 * in sections/index.ts — no changes to HtmlReporter.generate() are required.
 */
export interface IHtmlTemplateSection {
  /** Unique key identifying this section */
  readonly key: string;
  /**
   * Returns true if this section has content to render for the given result.
   * If false, the section is skipped entirely.
   */
  hasContent(result: BlueprintResult): boolean;
  /**
   * Renders this section as an HTML string.
   * Called only when hasContent() returns true.
   */
  render(result: BlueprintResult): string;
}
