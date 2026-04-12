import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { SiteMap } from '../types/siteMap.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawSiteMap {
  sitemapid: string;
  sitemapname?: string;
  sitemapnameunique?: string;
  isappaware?: boolean;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

/**
 * Discovery service for Site Maps (navigation structure).
 * Component type code: 62 — Strategy A.
 */
export class SiteMapDiscovery implements IDiscoverer<SiteMap> {
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

  async discoverByIds(ids: string[]): Promise<SiteMap[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawSiteMap>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'sitemapid', { guids: true });
        const result = await this.client.query<RawSiteMap>('sitemaps', {
          select: ['sitemapid', 'sitemapname', 'sitemapnameunique', 'isappaware', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Site Map Discovery',
        entitySet: 'sitemaps',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToSiteMap(raw));
  }

  private mapToSiteMap(raw: RawSiteMap): SiteMap {
    return {
      id: normalizeGuid(raw.sitemapid),
      name: raw.sitemapname || raw.sitemapid,
      uniqueName: raw.sitemapnameunique || raw.sitemapname || raw.sitemapid,
      isAppAware: raw.isappaware ?? false,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
