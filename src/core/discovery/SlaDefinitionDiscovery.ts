import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { SlaDefinition, SlaType, SlaStatus } from '../types/slaDefinition.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawSlaDefinition {
  slaid: string;
  name: string;
  description?: string | null;
  slatype?: number;
  primaryentityotc?: number | null;
  statuscode?: number;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

const SLA_TYPE_MAP: Record<number, SlaType> = {
  0: 'Standard',
  1: 'Enhanced',
};

const SLA_STATUS_MAP: Record<number, SlaStatus> = {
  1: 'Draft',
  2: 'Active',
  3: 'Cancelled',
  4: 'Expired',
};

/**
 * Discovery service for Service Level Agreement (SLA) Definitions.
 * Component type code: 152 — Strategy A.
 */
export class SlaDefinitionDiscovery implements IDiscoverer<SlaDefinition> {
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

  async discoverByIds(ids: string[]): Promise<SlaDefinition[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawSlaDefinition>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'slaid', { guids: true });
        const result = await this.client.query<RawSlaDefinition>('slas', {
          select: ['slaid', 'name', 'description', 'slatype', 'primaryentityotc', 'statuscode', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'SLA Definition Discovery',
        entitySet: 'slas',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToSlaDefinition(raw));
  }

  private mapToSlaDefinition(raw: RawSlaDefinition): SlaDefinition {
    return {
      id: normalizeGuid(raw.slaid),
      name: raw.name,
      description: raw.description ?? null,
      slaType: SLA_TYPE_MAP[raw.slatype ?? 0] ?? 'Standard',
      primaryEntityOtc: raw.primaryentityotc ?? null,
      status: SLA_STATUS_MAP[raw.statuscode ?? 1] ?? 'Draft',
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
