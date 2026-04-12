import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Dialog } from '../types/dialog.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawDialog {
  workflowid: string;
  name: string;
  description?: string | null;
  category?: number;
  statuscode?: number;
  primaryentity?: string | null;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

const DIALOG_STATUS_MAP: Record<number, Dialog['status']> = {
  1: 'Draft',
  2: 'Active',
  3: 'Suspended',
};

/**
 * Discovery service for deprecated Dialogs (workflow category 1).
 * IDs come from workflowInventory.dialogIds (classified by classifyWorkflows).
 */
export class DialogDiscovery implements IDiscoverer<Dialog> {
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

  async discoverByIds(ids: string[]): Promise<Dialog[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, RawDialog>(
      ids,
      async (batch) => {
        const filter = buildOrFilter(batch, 'workflowid', { guids: true });
        const result = await this.client.query<RawDialog>('workflows', {
          select: ['workflowid', 'name', 'description', 'category', 'statuscode', 'primaryentity', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Dialog Discovery',
        entitySet: 'workflows',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(done, total),
      }
    );

    return results.map(raw => this.mapToDialog(raw));
  }

  private mapToDialog(raw: RawDialog): Dialog {
    const statusCode = raw.statuscode ?? 1;
    return {
      id: normalizeGuid(raw.workflowid),
      name: raw.name,
      description: raw.description ?? null,
      status: DIALOG_STATUS_MAP[statusCode] ?? 'Draft',
      statusCode,
      primaryEntityName: raw.primaryentity ?? null,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
