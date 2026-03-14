/**
 * ExportFacade — produces all export formats from a BlueprintResult.
 *
 * Decoupled from BlueprintGenerator: it accepts a completed result and produces output.
 * All imports are static (PATTERN-007: dynamic imports break pptb-webview://).
 */
import type { BlueprintResult, MarkdownExport } from '../types/blueprint.js';
import { MarkdownReporter } from '../reporters/MarkdownReporter.js';
import { HtmlReporter } from '../reporters/HtmlReporter.js';
import { JsonReporter } from '../reporters/JsonReporter.js';
import { ZipPackager } from './ZipPackager.js';

export class ExportFacade {
  private readonly markdownReporter = new MarkdownReporter();
  private readonly htmlReporter = new HtmlReporter();
  private readonly jsonReporter = new JsonReporter();
  private readonly zipPackager = new ZipPackager();

  /**
   * Export as JSON string (pretty-printed, with metadata wrapper).
   */
  exportAsJson(result: BlueprintResult): string {
    return this.jsonReporter.generate(result);
  }

  /**
   * Export as Markdown file map.
   */
  exportAsMarkdown(result: BlueprintResult): MarkdownExport {
    return this.markdownReporter.generate(result);
  }

  /**
   * Export as single-page HTML document string.
   */
  exportAsHtml(result: BlueprintResult): string {
    return this.htmlReporter.generate(result);
  }

  /**
   * Package selected formats into a ZIP blob.
   * @param result Completed blueprint result
   * @param formats Array of format keys to include: 'json', 'html', 'markdown'
   */
  async exportAsZip(result: BlueprintResult, formats: string[]): Promise<Blob> {
    const json = formats.includes('json') ? this.exportAsJson(result) : undefined;
    const html = formats.includes('html') ? this.exportAsHtml(result) : undefined;
    const markdown = formats.includes('markdown') ? this.exportAsMarkdown(result) : undefined;
    return this.zipPackager.packageBlueprint(markdown, json, html);
  }
}
