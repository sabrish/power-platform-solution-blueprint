import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import type { CanvasApp } from '../types/canvasApp.js';
import type { CustomPage } from '../types/customPage.js';
import type { ModelDrivenApp } from '../types/modelDrivenApp.js';

/**
 * Raw record shape returned from canvasapps OData entity set.
 * Note: canvasapps does not expose modifiedon or createdon via OData.
 * canvasapptype values: 0 = Standard canvas app, 1 = Component library, 2 = Custom page.
 */
interface CanvasAppRecord {
  canvasappid: string;
  displayname: string;
  name: string;
  description?: string;
  ismanaged: boolean;
  canvasapptype?: number;
}

/**
 * Raw record shape returned from appmodules OData entity set
 */
interface AppModuleRecord {
  appmoduleid: string;
  name: string;           // friendly display name
  uniquename: string;     // unique logical name
  description?: string;
  ismanaged: boolean;
  modifiedon: string;
}

/**
 * Discovers Canvas Apps, Custom Pages, and Model-Driven Apps by their IDs.
 *
 * Canvas Apps and Custom Pages both use component type 300 in solutioncomponents
 * and both live in the canvasapps entity. They are differentiated post-retrieval
 * by the canvasapptype field: 0 = Standard canvas app, 1 = Component library (skipped), 2 = Custom page.
 */
export class AppDiscovery {
  constructor(
    private client: IDataverseClient,
    private onProgress?: (current: number, total: number) => void,
    private logger?: FetchLogger
  ) {}

  /**
   * Fetch all canvasapps records for the given IDs (which are all type 300 from
   * solutioncomponents) and split them into Canvas Apps and Custom Pages based
   * on canvasapptype. canvasapptype === 2 → Custom Page; canvasapptype === 0 or absent → Canvas App; canvasapptype === 1 (Component Library) → skipped.
   */
  async getAppsAndPagesByIds(ids: string[]): Promise<{ canvasApps: CanvasApp[]; customPages: CustomPage[] }> {
    if (ids.length === 0) return { canvasApps: [], customPages: [] };
    const records = await this.getCanvasAppRecordsByIds(ids, 'Canvas App & Custom Page Discovery');

    const canvasApps: CanvasApp[] = [];
    const customPages: CustomPage[] = [];

    for (const r of records) {
      const base = {
        id: r.canvasappid.toLowerCase().replace(/[{}]/g, ''),
        name: r.name ?? '',
        displayName: r.displayname ?? r.name ?? '',
        description: r.description || undefined,
        isManaged: r.ismanaged === true,
      };

      if (r.canvasapptype === 2) {
        customPages.push(base);
      } else if (r.canvasapptype === 0 || r.canvasapptype === undefined) {
        // 0 = Standard canvas app; undefined = field absent (treat as canvas app)
        // Skip canvasapptype === 1 (Component libraries — not user-facing apps)
        canvasApps.push(base);
      }
    }

    return { canvasApps, customPages };
  }

  /**
   * Fetch Model-Driven App records for the given IDs and map to ModelDrivenApp[]
   */
  async getModelDrivenAppsByIds(ids: string[]): Promise<ModelDrivenApp[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, AppModuleRecord>(
      ids,
      async (batch) => {
        const filter = batch.map(id => {
          const cleanId = id.replace(/[{}]/g, '');
          return `appmoduleid eq ${cleanId}`;
        }).join(' or ');

        const result = await this.client.query<AppModuleRecord>('appmodules', {
          select: ['appmoduleid', 'name', 'uniquename', 'description', 'ismanaged', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Model-Driven App Discovery',
        entitySet: 'appmodules',
        logger: this.logger,
        onProgress: this.onProgress
          ? (done) => this.onProgress!(done, ids.length)
          : undefined,
      }
    );

    return results.map(r => ({
      id: r.appmoduleid.toLowerCase().replace(/[{}]/g, ''),
      name: r.uniquename ?? '',
      displayName: r.name ?? r.uniquename ?? '',
      description: r.description || undefined,
      isManaged: r.ismanaged === true,
      modifiedOn: r.modifiedon,
    }));
  }

  /**
   * Batch-fetches raw canvasapp records by ID, including apptype for subtype detection.
   */
  private async getCanvasAppRecordsByIds(
    ids: string[],
    step: string
  ): Promise<CanvasAppRecord[]> {
    if (ids.length === 0) return [];

    const { results } = await withAdaptiveBatch<string, CanvasAppRecord>(
      ids,
      async (batch) => {
        const filter = batch.map(id => {
          const cleanId = id.replace(/[{}]/g, '');
          return `canvasappid eq ${cleanId}`;
        }).join(' or ');

        const result = await this.client.query<CanvasAppRecord>('canvasapps', {
          select: ['canvasappid', 'displayname', 'name', 'description', 'ismanaged', 'canvasapptype'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step,
        entitySet: 'canvasapps',
        logger: this.logger,
        onProgress: this.onProgress
          ? (done) => this.onProgress!(done, ids.length)
          : undefined,
      }
    );

    return results;
  }
}
