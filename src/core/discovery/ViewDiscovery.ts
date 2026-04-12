import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { View } from '../types/view.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawView {
  savedqueryid: string;
  name: string;
  description?: string | null;
  returnedtypecode?: string;
  querytype?: number;
  isdefault?: boolean;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

const QUERY_TYPE_NAMES: Record<number, string> = {
  0: 'Public View',
  1: 'Advanced Find',
  2: 'Associated View',
  4: 'Quick Find',
  64: 'Lookup',
  128: 'Sub-Grid',
  256: 'Main',
  512: 'Offline Filters',
  8192: 'Export Filters',
  16384: 'Outlook Filters',
};

function mapQueryTypeName(querytype: number): string {
  return QUERY_TYPE_NAMES[querytype] ?? `View (type ${querytype})`;
}

/**
 * Discovery service for Views (Saved Queries).
 * Component type code: 26 — Strategy A.
 */
export class ViewDiscovery implements IDiscoverer<View> {
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

  async discoverByIds(ids: string[]): Promise<View[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawView>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'savedqueryid', { guids: true });
        const result = await this.client.query<RawView>('savedqueries', {
          select: ['savedqueryid', 'name', 'description', 'returnedtypecode', 'querytype', 'isdefault', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'View Discovery',
        entitySet: 'savedqueries',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToView(raw));
  }

  private mapToView(raw: RawView): View {
    const queryType = raw.querytype ?? 0;
    return {
      id: normalizeGuid(raw.savedqueryid),
      name: raw.name,
      description: raw.description ?? null,
      returnedTypeCode: raw.returnedtypecode || '',
      queryType,
      queryTypeName: mapQueryTypeName(queryType),
      isDefault: raw.isdefault ?? false,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
