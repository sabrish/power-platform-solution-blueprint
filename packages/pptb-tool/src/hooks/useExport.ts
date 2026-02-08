import { useState } from 'react';
import type { ExportProgress } from '@ppsb/core';

/**
 * Hook result interface
 */
export interface UseExportResult {
  exportMarkdown: () => Promise<void>;
  exportJson: () => Promise<void>;
  exportHtml: () => Promise<void>;
  exportZip: (formats: string[]) => Promise<void>;
  exportAll: () => Promise<void>;
  isExporting: boolean;
  progress: ExportProgress | null;
  error: Error | null;
  clearError: () => void;
}

/**
 * Hook for export operations with browser download
 * @param blueprintGenerator BlueprintGenerator instance
 * @returns Export functions and state
 */
export function useExport(blueprintGenerator: any): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Trigger browser download of file
   */
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Export as JSON
   */
  const exportJson = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress({
        phase: 'Generating JSON export',
        current: 0,
        total: 1,
        message: 'Serializing blueprint data...',
      });

      const json = await blueprintGenerator.exportAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadFile(blob, `blueprint-${timestamp}.json`);

      setProgress({
        phase: 'Complete',
        current: 1,
        total: 1,
        message: 'JSON export downloaded',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      // Clear progress after short delay
      setTimeout(() => setProgress(null), 2000);
    }
  };

  /**
   * Export as Markdown (ZIP)
   */
  const exportMarkdown = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress({
        phase: 'Generating Markdown export',
        current: 0,
        total: 3,
        message: 'Generating documentation files...',
      });

      const zip = await blueprintGenerator.exportAsZip(['markdown']);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadFile(zip, `blueprint-markdown-${timestamp}.zip`);

      setProgress({
        phase: 'Complete',
        current: 3,
        total: 3,
        message: 'Markdown export downloaded',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  /**
   * Export as HTML (single file, no ZIP)
   */
  const exportHtmlSingle = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress({
        phase: 'Generating HTML export',
        current: 0,
        total: 1,
        message: 'Creating interactive document...',
      });

      const html = await blueprintGenerator.exportAsHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadFile(blob, `blueprint-${timestamp}.html`);

      setProgress({
        phase: 'Complete',
        current: 1,
        total: 1,
        message: 'HTML export downloaded',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  /**
   * Export as HTML (ZIP - for backward compatibility)
   */
  const exportHtml = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress({
        phase: 'Generating HTML export',
        current: 0,
        total: 1,
        message: 'Creating interactive document...',
      });

      const zip = await blueprintGenerator.exportAsZip(['html']);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadFile(zip, `blueprint-${timestamp}.html.zip`);

      setProgress({
        phase: 'Complete',
        current: 1,
        total: 1,
        message: 'HTML export downloaded',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  /**
   * Export selected formats as ZIP (or single file if applicable)
   */
  const exportZip = async (formats: string[]) => {
    try {
      setIsExporting(true);
      setError(null);

      // If only one format selected and it's HTML or JSON, export as single file
      if (formats.length === 1) {
        if (formats[0] === 'html') {
          await exportHtmlSingle();
          return;
        } else if (formats[0] === 'json') {
          await exportJson();
          return;
        }
        // For markdown (multiple files), continue with ZIP
      }

      const total = formats.length + 1; // +1 for packaging
      let current = 0;

      setProgress({
        phase: 'Generating exports',
        current: 0,
        total,
        message: `Generating ${formats.length} format(s)...`,
      });

      // Generate all formats
      for (const format of formats) {
        current++;
        setProgress({
          phase: `Generating ${format}`,
          current,
          total,
          message: `Generating ${format} export...`,
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI update
      }

      setProgress({
        phase: 'Packaging',
        current: formats.length,
        total,
        message: 'Creating ZIP archive...',
      });

      const zip = await blueprintGenerator.exportAsZip(formats);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      downloadFile(zip, `blueprint-${timestamp}.zip`);

      setProgress({
        phase: 'Complete',
        current: total,
        total,
        message: 'Export downloaded successfully',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  /**
   * Export all formats
   */
  const exportAll = async () => {
    await exportZip(['markdown', 'json', 'html']);
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    exportMarkdown,
    exportJson,
    exportHtml,
    exportZip,
    exportAll,
    isExporting,
    progress,
    error,
    clearError,
  };
}
