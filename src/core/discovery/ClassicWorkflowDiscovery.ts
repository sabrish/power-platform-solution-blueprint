import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { ClassicWorkflow } from '../types/classicWorkflow.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';

interface RawClassicWorkflowMeta {
  workflowid: string;
  name: string;
  description: string | null;
  type: number;
  category: number;
  mode: number;
  triggeroncreate: boolean;
  triggeronupdateattributelist: string | null;
  triggerondelete: boolean;
  ondemand: boolean;
  scope: number;
  primaryentity: string;
  statecode: number;
  ismanaged: boolean;
  createdon: string;
  modifiedon: string;
  '_primaryentity_value@OData.Community.Display.V1.FormattedValue'?: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
}

interface RawWorkflowXaml {
  workflowid: string;
  xaml?: string;
}

export class ClassicWorkflowDiscovery {
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

  async getClassicWorkflowsByIds(workflowIds: string[]): Promise<ClassicWorkflow[]> {
    if (workflowIds.length === 0) return [];

    try {
      // Pass 1 — metadata (no xaml) in adaptive batches of 20
      const { results: metaRecords } = await withAdaptiveBatch<string, RawClassicWorkflowMeta>(
        workflowIds,
        async (batch) => {
          const filter = buildOrFilter(batch, 'workflowid', { guids: true });
          const result = await this.client.query<RawClassicWorkflowMeta>('workflows', {
            select: [
              'workflowid', 'name', 'description', 'type', 'category', 'mode',
              'triggeroncreate', 'triggeronupdateattributelist', 'triggerondelete',
              'ondemand', 'scope', 'primaryentity', 'statecode', 'ismanaged',
              'createdon', 'modifiedon', '_ownerid_value',
            ],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Classic Workflow Discovery',
          entitySet: 'workflows (metadata)',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(Math.floor(done / 2), total),
        }
      );

      // In Dataverse, publishing a Classic Workflow creates two records: type=1 (Definition,
      // the editable template) and type=2 (Activation, the runtime version that actually fires).
      // Both appear as solution components so both IDs arrive here. Keep only Activations —
      // a Definition without an Activation is unpublished and has no runtime behaviour.
      const activationRecords = metaRecords.filter(r => r.type === 2);

      // Pass 2 — fetch xaml separately in small batches (can be large XML payloads)
      const fetchedIds = activationRecords.map(r => r.workflowid);
      const idToName = new Map(activationRecords.map(r => [r.workflowid.toLowerCase(), r.name]));
      const xamlMap = new Map<string, string>();

      const { results: xamlRecords } = await withAdaptiveBatch<string, RawWorkflowXaml>(
        fetchedIds,
        async (batch) => {
          const filter = buildOrFilter(batch, 'workflowid', { guids: true });
          const result = await this.client.query<RawWorkflowXaml>('workflows', {
            select: ['workflowid', 'xaml'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 5,
          step: 'Classic Workflow Discovery',
          entitySet: 'workflows (xaml)',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(
            Math.floor(activationRecords.length / 2) + Math.floor(done / 2),
            total
          ),
          getBatchLabel: (batch) => batch.map(id => idToName.get(id.toLowerCase()) ?? id).join(', '),
        }
      );

      for (const r of xamlRecords) {
        if (r.xaml) xamlMap.set(r.workflowid, r.xaml);
      }

      this.onProgress?.(activationRecords.length, activationRecords.length);

      // Sort in memory by entity then name
      activationRecords.sort((a, b) => {
        const ec = (a.primaryentity || '').localeCompare(b.primaryentity || '');
        return ec !== 0 ? ec : a.name.localeCompare(b.name);
      });

      return activationRecords.map(raw => this.mapToClassicWorkflow(raw, xamlMap.get(raw.workflowid) ?? ''));

    } catch (error) {
      throw new Error(
        `Failed to retrieve classic workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private mapToClassicWorkflow(raw: RawClassicWorkflowMeta, xaml: string): ClassicWorkflow {
    return {
      id: raw.workflowid,
      name: raw.name,
      description: raw.description,
      type: raw.type,
      typeName: this.getTypeName(raw.type),
      mode: raw.mode,
      modeName: this.getModeName(raw.mode),
      triggerOnCreate: raw.triggeroncreate,
      triggerOnUpdate: !!(raw.triggeronupdateattributelist),
      triggerOnDelete: raw.triggerondelete,
      onDemand: raw.ondemand,
      scope: raw.scope,
      scopeName: this.getScopeName(raw.scope),
      entity: raw.primaryentity,
      entityDisplayName: raw['_primaryentity_value@OData.Community.Display.V1.FormattedValue'] || null,
      state: this.getStateName(raw.statecode),
      isManaged: raw.ismanaged,
      xaml,
      triggerOnUpdateAttributes: raw.triggeronupdateattributelist
        ? raw.triggeronupdateattributelist.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  private getTypeName(type: number): string {
    switch (type) {
      case 1: return 'Definition';
      case 2: return 'Activation';
      case 3: return 'Template';
      default: return 'Unknown';
    }
  }

  private getModeName(mode: number): string {
    switch (mode) {
      case 0: return 'Background';
      case 1: return 'RealTime';
      default: return 'Unknown';
    }
  }

  private getScopeName(scope: number): string {
    switch (scope) {
      case 1: return 'User';
      case 2: return 'Business Unit';
      case 4: return 'Parent-Child Business Units';
      case 8: return 'Organization';
      default: return 'Unknown';
    }
  }

  private getStateName(statecode: number): 'Draft' | 'Active' | 'Suspended' {
    switch (statecode) {
      case 0: return 'Draft';
      case 1: return 'Active';
      case 2: return 'Suspended';
      default: return 'Draft';
    }
  }
}
