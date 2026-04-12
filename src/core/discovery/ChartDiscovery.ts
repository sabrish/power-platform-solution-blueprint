import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Chart } from '../types/chart.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawChart {
  savedqueryvisualizationid: string;
  name: string;
  description?: string | null;
  primaryentitytypecode?: string;
  charttype?: number | null;
  isdefault?: boolean;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

/**
 * Discovery service for Charts (Saved Query Visualizations).
 * Component type code: 59 — Strategy A.
 */
export class ChartDiscovery implements IDiscoverer<Chart> {
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

  async discoverByIds(ids: string[]): Promise<Chart[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawChart>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'savedqueryvisualizationid', { guids: true });
        const result = await this.client.query<RawChart>('savedqueryvisualizations', {
          select: ['savedqueryvisualizationid', 'name', 'description', 'primaryentitytypecode', 'charttype', 'isdefault', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Chart Discovery',
        entitySet: 'savedqueryvisualizations',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToChart(raw));
  }

  private mapToChart(raw: RawChart): Chart {
    return {
      id: normalizeGuid(raw.savedqueryvisualizationid),
      name: raw.name,
      description: raw.description ?? null,
      primaryEntityTypeCode: raw.primaryentitytypecode || '',
      chartType: raw.charttype ?? null,
      isDefault: raw.isdefault ?? false,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
