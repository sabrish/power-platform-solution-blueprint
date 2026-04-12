import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { AiModel } from '../types/aiModel.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawAiModel {
  msdyn_aimodelid: string;
  msdyn_name?: string;
  msdyn_modelcreationcontext?: string | null;
  msdyn_templateid?: string | null;
  statuscode?: number;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

const AI_MODEL_STATUS_MAP: Record<number, AiModel['status']> = {
  0: 'Inactive',
  1: 'Active',
};

/**
 * Discovery service for AI Builder Models (msdyn_aimodel).
 * Component type codes: 400 (AI Project Type), 401 (AI Project), 402 (AI Configuration)
 * all route here. Table may not exist in all environments.
 */
export class AiModelDiscovery implements IDiscoverer<AiModel> {
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

  async discoverByIds(ids: string[]): Promise<AiModel[]> {
    if (ids.length === 0) return [];

    try {
      const { results } = await withAdaptiveBatch<string, RawAiModel>(
        ids,
        async (batch) => {
          const filter = buildOrFilter(batch, 'msdyn_aimodelid', { guids: true });
          const result = await this.client.query<RawAiModel>('msdyn_aimodels', {
            select: ['msdyn_aimodelid', 'msdyn_name', 'msdyn_modelcreationcontext', 'msdyn_templateid', 'statuscode', 'ismanaged', 'createdon', 'modifiedon'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 15,
          step: 'AI Model Discovery',
          entitySet: 'msdyn_aimodels',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(done, total),
        }
      );

      return results.map(raw => this.mapToAiModel(raw));
    } catch {
      // msdyn_aimodels table may not exist in all environments — return empty gracefully
      return [];
    }
  }

  private mapToAiModel(raw: RawAiModel): AiModel {
    const statusCode = raw.statuscode ?? 0;
    return {
      id: normalizeGuid(raw.msdyn_aimodelid),
      name: raw.msdyn_name || raw.msdyn_aimodelid,
      templateId: raw.msdyn_templateid ?? null,
      modelCreationContext: raw.msdyn_modelcreationcontext ?? null,
      status: AI_MODEL_STATUS_MAP[statusCode] ?? 'Unknown',
      statusCode,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
    };
  }
}
