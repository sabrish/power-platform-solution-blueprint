import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { DuplicateDetectionRule } from '../types/duplicateDetectionRule.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawDuplicateDetectionRule {
  duplicateruleid: string;
  name: string;
  description?: string | null;
  baseentityname: string;
  matchingentityname: string;
  statuscode: number;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

/**
 * Discovery service for Duplicate Detection Rules.
 * Component type code: 44 — Strategy A.
 */
export class DuplicateDetectionRuleDiscovery implements IDiscoverer<DuplicateDetectionRule> {
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

  async discoverByIds(ids: string[]): Promise<DuplicateDetectionRule[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawDuplicateDetectionRule>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'duplicateruleid', { guids: true });
        const result = await this.client.query<RawDuplicateDetectionRule>('duplicaterules', {
          select: ['duplicateruleid', 'name', 'description', 'baseentityname', 'matchingentityname', 'statuscode', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Duplicate Detection Rule Discovery',
        entitySet: 'duplicaterules',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToRule(raw));
  }

  private mapToRule(raw: RawDuplicateDetectionRule): DuplicateDetectionRule {
    const statusMap: Record<number, 'Active' | 'Inactive'> = {
      0: 'Inactive',
      1: 'Active',
    };
    return {
      id: normalizeGuid(raw.duplicateruleid),
      name: raw.name,
      description: raw.description ?? null,
      baseEntityName: raw.baseentityname,
      matchingEntityName: raw.matchingentityname,
      status: statusMap[raw.statuscode] ?? 'Inactive',
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
