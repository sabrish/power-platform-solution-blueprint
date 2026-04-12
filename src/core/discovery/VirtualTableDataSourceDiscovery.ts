import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { VirtualTableDataSource } from '../types/virtualTableDataSource.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawVirtualTableDataSource {
  entitydatasourceid: string;
  name: string;
  description?: string | null;
  entitydatasourcetypeid?: string | null;
  // connectiondefinition intentionally not mapped — may contain credentials
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

/**
 * Discovery service for Virtual Table Data Sources (entitydatasources).
 * Component type code: 166 — Strategy A.
 *
 * SECURITY: connectiondefinition field is never fetched or exposed —
 * it may contain credentials for external data connections.
 */
export class VirtualTableDataSourceDiscovery implements IDiscoverer<VirtualTableDataSource> {
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

  async discoverByIds(ids: string[]): Promise<VirtualTableDataSource[]> {
    if (ids.length === 0) return [];

    try {
      const { results } = await withAdaptiveBatch<string, RawVirtualTableDataSource>(
        ids,
        async (batch) => {
          const filter = buildOrFilter(batch, 'entitydatasourceid', { guids: true });
          // NOTE: connectiondefinition is intentionally excluded from $select — it may contain credentials
          const result = await this.client.query<RawVirtualTableDataSource>('entitydatasources', {
            select: ['entitydatasourceid', 'name', 'description', 'entitydatasourcetypeid', 'ismanaged', 'createdon', 'modifiedon'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Virtual Table Data Source Discovery',
          entitySet: 'entitydatasources',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(done, total),
        }
      );

      return results.map(raw => this.mapToDataSource(raw));
    } catch {
      // entitydatasources table may not exist in all environments — return empty gracefully
      return [];
    }
  }

  private mapToDataSource(raw: RawVirtualTableDataSource): VirtualTableDataSource {
    return {
      id: normalizeGuid(raw.entitydatasourceid),
      name: raw.name,
      description: raw.description ?? null,
      dataSourceTypeId: raw.entitydatasourcetypeid ?? null,
      // connectionDefinition is always null — never expose raw connection credentials
      connectionDefinition: null,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
