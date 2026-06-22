import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { PcfControl } from '../types/pcfControl.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid, normalizeBatch } from '../utils/guid.js';

interface RawPcfControl {
  customcontrolid: string;
  name: string;
  displayname?: string;
  compatibledatatypes?: string;
  version?: string;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

const PCF_SELECT = 'customcontrolid,name,displayname,compatibledatatypes,version,ismanaged,createdon,modifiedon';

/**
 * Discovery service for PCF (Power Apps Component Framework) custom controls.
 * Component type code: 66 (Custom Control) — Strategy A.
 */
export class PcfControlDiscovery implements IDiscoverer<PcfControl> {
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

  async discoverByIds(ids: string[]): Promise<PcfControl[]> {
    return this.getControlsByIds(ids);
  }

  async getControlsByIds(ids: string[]): Promise<PcfControl[]> {
    if (ids.length === 0) return [];

    const cleanIds = normalizeBatch(ids);

    const { results } = await withAdaptiveBatch<string, RawPcfControl>(
      cleanIds,
      async (batch) => {
        const filter = buildOrFilter(batch, 'customcontrolid', { guids: true });
        const result = await this.client.query<RawPcfControl>('customcontrols', {
          select: ['customcontrolid', 'name', 'displayname', 'compatibledatatypes', 'version', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'PCF Control Discovery',
        entitySet: 'customcontrols',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
        getRequestUrl: (batch) => {
          const filter = buildOrFilter(batch, 'customcontrolid', { guids: true });
          return `${this.client.getEnvironmentUrl()}/api/data/v9.2/customcontrols?$select=${PCF_SELECT}&$filter=${encodeURIComponent(filter)}`;
        },
      }
    );

    return results.map(raw => this.mapToPcfControl(raw));
  }

  private mapToPcfControl(raw: RawPcfControl): PcfControl {
    return {
      id: normalizeGuid(raw.customcontrolid),
      name: raw.name,
      displayName: raw.displayname || raw.name,
      compatibleDataTypes: raw.compatibledatatypes || '',
      version: raw.version || '',
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
