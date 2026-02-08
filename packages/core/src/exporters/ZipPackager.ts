import JSZip from 'jszip';
import type { MarkdownExport } from '../types/blueprint.js';

/**
 * Package all exports into downloadable ZIP file
 *
 * ZIP Structure:
 * system-blueprint-{timestamp}.zip
 * ├── markdown/
 * │   ├── README.md
 * │   ├── summary/
 * │   ├── entities/
 * │   └── analysis/
 * ├── blueprint.json
 * ├── blueprint.html
 * └── metadata.txt
 */
export class ZipPackager {
  /**
   * Package blueprint exports into ZIP blob
   * @param markdown Markdown export (optional)
   * @param json JSON export string (optional)
   * @param html HTML export string (optional)
   * @returns ZIP file as Blob
   */
  async packageBlueprint(
    markdown?: MarkdownExport,
    json?: string,
    html?: string
  ): Promise<Blob> {
    const zip = new JSZip();
    const timestamp = new Date();

    // Add markdown files if provided
    if (markdown) {
      const markdownFolder = zip.folder('markdown');
      if (markdownFolder) {
        for (const [filepath, content] of markdown.files.entries()) {
          markdownFolder.file(filepath, content);
        }
      }
    }

    // Add JSON if provided
    if (json) {
      zip.file('blueprint.json', json);
    }

    // Add HTML if provided
    if (html) {
      zip.file('blueprint.html', html);
    }

    // Add metadata file
    const metadata = this.generateMetadata(timestamp, markdown, json, html);
    zip.file('metadata.txt', metadata);

    // Generate ZIP blob with compression
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // Moderate compression (1-9, where 9 is maximum)
      },
    });

    return blob;
  }

  /**
   * Generate metadata.txt content
   */
  private generateMetadata(
    timestamp: Date,
    markdown?: MarkdownExport,
    json?: string,
    html?: string
  ): string {
    const lines: string[] = [];

    lines.push('Power Platform Solution Blueprint - Export Metadata');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Generated: ${timestamp.toISOString()}`);
    lines.push(`Tool Version: 1.0.0`);
    lines.push('');
    lines.push('Exported Formats:');
    lines.push('-'.repeat(60));

    if (markdown) {
      lines.push(`✓ Markdown (${markdown.totalFiles} files, ${this.formatBytes(markdown.totalSize)})`);
    }

    if (json) {
      const jsonSize = new TextEncoder().encode(json).length;
      lines.push(`✓ JSON (${this.formatBytes(jsonSize)})`);
    }

    if (html) {
      const htmlSize = new TextEncoder().encode(html).length;
      lines.push(`✓ HTML (${this.formatBytes(htmlSize)})`);
    }

    lines.push('');
    lines.push('File Structure:');
    lines.push('-'.repeat(60));

    if (markdown) {
      lines.push('markdown/');
      lines.push('  ├── README.md');
      lines.push('  ├── summary/');
      lines.push('  ├── entities/');
      lines.push('  └── analysis/');
    }

    if (json) {
      lines.push('blueprint.json');
    }

    if (html) {
      lines.push('blueprint.html');
    }

    lines.push('metadata.txt');
    lines.push('');
    lines.push('Usage:');
    lines.push('-'.repeat(60));
    lines.push('- Extract ZIP to view all files');
    lines.push('- Markdown: Upload to Azure DevOps Wiki or GitHub');
    lines.push('- JSON: Use for baselines, automation, or programmatic analysis');
    lines.push('- HTML: Open blueprint.html in any modern web browser');
    lines.push('');
    lines.push('For more information, visit:');
    lines.push('https://github.com/anthropics/power-platform-solution-blueprint');

    return lines.join('\n');
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
