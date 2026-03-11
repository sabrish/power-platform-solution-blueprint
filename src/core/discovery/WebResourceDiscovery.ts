import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { WebResource } from '../types/blueprint.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { JavaScriptParser } from '../parsers/JavaScriptParser.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';

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

export class WebResourceDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;
  private logger?: FetchLogger;

  constructor(
    client: IDataverseClient,
    onProgress?: (current: number, total: number) => void,
    logger?: FetchLogger
  ) {
    this.client = client;
    this.onProgress = onProgress;
    this.logger = logger;
  }

  async getWebResourcesByIds(resourceIds: string[]): Promise<WebResource[]> {
    if (resourceIds.length === 0) return [];

    try {
      // Pass 1 — metadata only (no content), adaptive batches of 20
      const { results: allResults } = await withAdaptiveBatch<string, WebResourceRecord>(
        resourceIds,
        async (batch) => {
          const filter = buildOrFilter(batch, 'webresourceid', { guids: true });
          const response = await this.client.query<WebResourceRecord>('webresourceset', {
            select: [
              'webresourceid', 'name', 'displayname', 'webresourcetype',
              'description', 'modifiedon', 'createdon',
            ],
            filter,
          });
          return response.value;
        },
        {
          initialBatchSize: 20,
          step: 'Web Resource Discovery',
          entitySet: 'webresourceset (metadata)',
          logger: this.logger,
          onProgress: (done) => this.onProgress?.(done, resourceIds.length),
        }
      );

      // Pass 2 — fetch content for JS resources only (type === 3), small batches
      const jsResources = allResults.filter(r => r.webresourcetype === 3);
      const jsIds = jsResources.map(r => r.webresourceid);
      const idToName = new Map(jsResources.map(r => [r.webresourceid.toLowerCase(), r.name]));
      const contentMap = new Map<string, string>();

      if (jsIds.length > 0) {
        const { results: cdRecords } = await withAdaptiveBatch<string, { webresourceid: string; content: string | null }>(
          jsIds,
          async (batch) => {
            const filter = buildOrFilter(batch, 'webresourceid', { guids: true });
            const response = await this.client.query<{ webresourceid: string; content: string | null }>(
              'webresourceset',
              { select: ['webresourceid', 'content'], filter }
            );
            return response.value;
          },
          {
            initialBatchSize: 5,
            step: 'Web Resource Discovery',
            entitySet: 'webresourceset (content)',
            logger: this.logger,
            getBatchLabel: (batch) => batch.map(id => idToName.get(id.toLowerCase()) ?? id).join(', '),
          }
        );

        for (const rec of cdRecords) {
          if (rec.content) contentMap.set(rec.webresourceid, rec.content);
        }
      }

      this.onProgress?.(resourceIds.length, resourceIds.length);

      return allResults.map(record =>
        this.mapRecordToWebResource({
          ...record,
          content: contentMap.get(record.webresourceid) ?? null,
        })
      );

    } catch (error) {
      throw error;
    }
  }

  private mapRecordToWebResource(record: WebResourceRecord): WebResource {
    const typeName = this.getTypeName(record.webresourcetype);
    let content: string | null = null;
    let contentSize = 0;

    if (record.content) {
      contentSize = record.content.length;
      if (this.isTextResource(record.webresourcetype)) {
        try { content = atob(record.content); } catch { content = null; }
      }
    }

    let analysis = null;
    let hasExternalCalls = false;
    let isDeprecated = false;

    if (record.webresourcetype === 3 && content) {
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

  private getTypeName(type: number): string {
    const typeNames: Record<number, string> = {
      1: 'HTML', 2: 'CSS', 3: 'JavaScript', 4: 'XML',
      5: 'PNG', 6: 'JPG', 7: 'GIF', 9: 'XSL', 10: 'ICO', 11: 'SVG', 12: 'RESX',
    };
    return typeNames[type] || 'Unknown';
  }

  private isTextResource(type: number): boolean {
    return [1, 2, 3, 4, 9, 11, 12].includes(type);
  }
}
