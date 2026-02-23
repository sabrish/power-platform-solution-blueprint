import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { WebResource } from '../types/blueprint.js';
import { JavaScriptParser } from '../parsers/JavaScriptParser.js';

interface WebResourceRecord {
  webresourceid: string;
  name: string;
  displayname: string | null;
  webresourcetype: number;
  content: string | null;
  description: string | null;
  modifiedon: string;
  createdon: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Discovers Web Resources (JavaScript, HTML, CSS, etc.)
 */
export class WebResourceDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;

  constructor(client: IDataverseClient, onProgress?: (current: number, total: number) => void) {
    this.client = client;
    this.onProgress = onProgress;
  }

  /**
   * Get web resources by IDs
   */
  async getWebResourcesByIds(resourceIds: string[]): Promise<WebResource[]> {
    if (resourceIds.length === 0) {
      return [];
    }

    try {
      const batchSize = 20;
      const allResults: WebResourceRecord[] = [];

      // Pass 1: fetch metadata only (no content) — avoids large payload timeouts
      for (let i = 0; i < resourceIds.length; i += batchSize) {
        const batch = resourceIds.slice(i, i + batchSize);
        const filterClauses = batch.map((id) => `webresourceid eq ${id}`);
        const filter = filterClauses.join(' or ');

        const response = await this.client.query<WebResourceRecord>('webresourceset', {
          select: [
            'webresourceid',
            'name',
            'displayname',
            'webresourcetype',
            'description',
            'modifiedon',
            'createdon',
          ],
          filter,
        });

        allResults.push(...response.value);

        if (this.onProgress) {
          this.onProgress(allResults.length, resourceIds.length);
        }
      }

      // Pass 2: fetch content for JS resources only (type=3), small batches
      // Only JS needs content for analysis; images/CSS/HTML do not
      const jsIds = allResults
        .filter((r) => r.webresourcetype === 3)
        .map((r) => r.webresourceid);
      const contentMap = new Map<string, string>();

      if (jsIds.length > 0) {
        const contentBatchSize = 5;
        try {
          for (let i = 0; i < jsIds.length; i += contentBatchSize) {
            const batch = jsIds.slice(i, i + contentBatchSize);
            const filterClauses = batch.map((id) => `webresourceid eq ${id}`);
            const filter = filterClauses.join(' or ');

            const response = await this.client.query<{ webresourceid: string; content: string | null }>(
              'webresourceset',
              { select: ['webresourceid', 'content'], filter }
            );

            for (const rec of response.value) {
              if (rec.content) {
                contentMap.set(rec.webresourceid, rec.content);
              }
            }
          }
        } catch {
          // Content fetch failed — JS analysis will be skipped but metadata is intact
        }
      }

      // Map to WebResource, merging JS content where available
      return allResults.map((record) =>
        this.mapRecordToWebResource({
          ...record,
          content: contentMap.get(record.webresourceid) ?? null,
        })
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Map web resource record to WebResource object
   */
  private mapRecordToWebResource(record: WebResourceRecord): WebResource {
    // Get type name
    const typeName = this.getTypeName(record.webresourcetype);

    // Decode content if it's a text-based resource
    let content: string | null = null;
    let contentSize = 0;

    if (record.content) {
      // Content is base64 encoded
      contentSize = record.content.length;

      // Decode for text resources
      if (this.isTextResource(record.webresourcetype)) {
        try {
          content = atob(record.content);
        } catch (error) {
          content = null;
        }
      }
    }

    // Analyze JavaScript if applicable
    let analysis = null;
    let hasExternalCalls = false;
    let isDeprecated = false;

    if (record.webresourcetype === 3 && content) {
      // JavaScript resource
      analysis = JavaScriptParser.parse(content, record.name);
      hasExternalCalls = analysis.externalCalls.length > 0;
      isDeprecated = analysis.usesDeprecatedXrmPage;
    }

    return {
      id: record.webresourceid,
      name: record.name,
      displayName: record.displayname || record.name,
      type: record.webresourcetype,
      typeName,
      content,
      contentSize,
      description: record.description,
      analysis,
      modifiedBy: record['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: record.modifiedon,
      createdOn: record.createdon,
      hasExternalCalls,
      isDeprecated,
    };
  }

  /**
   * Get type name from web resource type number
   */
  private getTypeName(type: number): string {
    const typeNames: Record<number, string> = {
      1: 'HTML',
      2: 'CSS',
      3: 'JavaScript',
      4: 'XML',
      5: 'PNG',
      6: 'JPG',
      7: 'GIF',
      9: 'XSL',
      10: 'ICO',
      11: 'SVG',
      12: 'RESX',
    };

    return typeNames[type] || 'Unknown';
  }

  /**
   * Check if resource type is text-based
   */
  private isTextResource(type: number): boolean {
    // Text-based types: HTML, CSS, JS, XML, XSL, RESX, SVG
    return [1, 2, 3, 4, 9, 11, 12].includes(type);
  }
}
