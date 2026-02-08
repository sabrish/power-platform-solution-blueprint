import type { BlueprintResult } from '@ppsb/core';

/**
 * Estimate export file sizes before generation
 * Provides user with preview of download size
 */

/**
 * Estimate total size of markdown export
 * @param result Blueprint result
 * @returns Estimated size in bytes
 */
export function estimateMarkdownSize(result: BlueprintResult): number {
  // Base overhead for file structure
  let size = 50000; // ~50KB for README, directory structure, etc.

  // Summary files (~5KB each × 12 files)
  size += 60000;

  // Entity files
  const entityCount = result.entities.length;
  // Each entity: overview (~2KB) + schema (~5KB) + automation (~3KB) + pipeline (~2KB)
  size += entityCount * 12000;

  // Attribute details (estimated 100 bytes per attribute)
  const totalAttributes = result.summary.totalAttributes;
  size += totalAttributes * 100;

  // Plugin documentation (estimated 500 bytes per plugin)
  size += result.summary.totalPlugins * 500;

  // Flow documentation (estimated 400 bytes per flow)
  size += result.summary.totalFlows * 400;

  // Business rule documentation (estimated 300 bytes per BR)
  size += result.summary.totalBusinessRules * 300;

  // Web resource documentation (estimated 200 bytes per WR)
  size += result.summary.totalWebResources * 200;

  // Analysis files
  size += 30000; // ~30KB for complexity, performance, migration analysis

  // ERD diagram (Mermaid diagram size)
  if (result.erd) {
    size += result.erd.diagrams.reduce((sum, d) => sum + d.mermaidDiagram.length, 0);
  }

  return size;
}

/**
 * Estimate JSON export size
 * @param result Blueprint result
 * @returns Estimated size in bytes
 */
export function estimateJsonSize(result: BlueprintResult): number {
  // Quick estimation: stringify a sample and extrapolate
  // For better accuracy, we could stringify the whole thing, but that's expensive

  // Base JSON wrapper overhead
  let size = 500;

  // Metadata
  size += 1000;

  // Summary
  size += 500;

  // Entities (average ~5KB per entity in JSON)
  size += result.entities.length * 5000;

  // Plugins (average ~800 bytes per plugin)
  size += result.summary.totalPlugins * 800;

  // Flows (average ~1KB per flow)
  size += result.summary.totalFlows * 1000;

  // Business rules (average ~600 bytes)
  size += result.summary.totalBusinessRules * 600;

  // Classic workflows (average ~800 bytes)
  size += result.summary.totalClassicWorkflows * 800;

  // Web resources (average ~500 bytes, but can be larger if content included)
  size += result.summary.totalWebResources * 500;

  // Custom APIs (average ~400 bytes)
  size += result.summary.totalCustomAPIs * 400;

  // Environment variables (average ~300 bytes)
  size += result.summary.totalEnvironmentVariables * 300;

  // Connection references (average ~300 bytes)
  size += result.summary.totalConnectionReferences * 300;

  // ERD
  if (result.erd) {
    size += JSON.stringify(result.erd).length;
  }

  // Cross-entity links
  if (result.crossEntityLinks) {
    size += result.crossEntityLinks.length * 200;
  }

  // External endpoints
  if (result.externalEndpoints) {
    size += result.externalEndpoints.length * 400;
  }

  return size;
}

/**
 * Estimate HTML export size
 * @param result Blueprint result
 * @returns Estimated size in bytes
 */
export function estimateHtmlSize(result: BlueprintResult): number {
  // HTML has overhead for CSS, JavaScript, and structure
  let size = 100000; // ~100KB base (HTML structure, CSS, embedded JS, Mermaid CDN link)

  // Summary cards and tables
  size += 20000;

  // Entity sections (estimated ~3KB per entity in HTML)
  size += result.entities.length * 3000;

  // Plugin tables (estimated ~400 bytes per plugin row)
  size += result.summary.totalPlugins * 400;

  // Flow tables (estimated ~350 bytes per flow row)
  size += result.summary.totalFlows * 350;

  // Business rule tables
  size += result.summary.totalBusinessRules * 300;

  // Web resource tables
  size += result.summary.totalWebResources * 250;

  // ERD diagram (embedded Mermaid)
  if (result.erd) {
    size += result.erd.diagrams.reduce((sum, d) => sum + d.mermaidDiagram.length, 0);
  }

  return size;
}

/**
 * Format bytes to human-readable string
 * @param bytes Size in bytes
 * @returns Formatted string (e.g., "1.2 MB", "450 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const decimals = 1;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Estimate total ZIP size (with compression)
 * @param markdownSize Markdown size estimate
 * @param jsonSize JSON size estimate
 * @param htmlSize HTML size estimate
 * @returns Estimated ZIP size in bytes (accounting for ~60% compression)
 */
export function estimateZipSize(
  markdownSize: number,
  jsonSize: number,
  htmlSize: number
): number {
  const totalUncompressed = markdownSize + jsonSize + htmlSize;
  // Assume ~40% compression ratio (text compresses well)
  return Math.round(totalUncompressed * 0.6);
}
