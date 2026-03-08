import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Flow } from '../types/blueprint.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { FlowDefinitionParser } from '../parsers/FlowDefinitionParser.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

interface WorkflowMetaRecord {
  workflowid: string;
  name: string;
  description: string | null;
  statecode: number;
  statuscode: number;
  primaryentity: string | null;
  scope: number;
  _ownerid_value: string;
  _modifiedby_value: string;
  modifiedon: string;
  createdon: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
  'primaryentity@OData.Community.Display.V1.FormattedValue'?: string;
}

interface WorkflowClientDataRecord {
  workflowid: string;
  clientdata: string | null;
}

export class FlowDiscovery {
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

  async getFlowsByIds(workflowIds: string[]): Promise<Flow[]> {
    if (workflowIds.length === 0) return [];

    // Pass 1 — fetch all metadata fields (no clientdata) in adaptive batches
    const { results: metaRecords } = await withAdaptiveBatch<string, WorkflowMetaRecord>(
      workflowIds,
      async (batch) => {
        const filter = `(${batch.map(id => `workflowid eq ${id}`).join(' or ')}) and category eq 5`;
        const response = await this.client.query<WorkflowMetaRecord>('workflows', {
          select: [
            'workflowid', 'name', 'description', 'statecode', 'statuscode',
            'primaryentity', 'scope', '_ownerid_value', '_modifiedby_value',
            'modifiedon', 'createdon',
          ],
          filter,
        });
        return response.value;
      },
      {
        initialBatchSize: 20,
        step: 'Flow Discovery',
        entitySet: 'workflows (metadata)',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(Math.floor(done / 2), total),
      }
    );

    // Pass 2 — fetch clientdata in small adaptive batches (large JSON payload)
    const fetchedIds = metaRecords.map(r => r.workflowid);
    const idToName = new Map(metaRecords.map(r => [r.workflowid.toLowerCase(), r.name]));
    const clientDataMap = new Map<string, string | null>();

    const { results: cdRecords } = await withAdaptiveBatch<string, WorkflowClientDataRecord>(
      fetchedIds,
      async (batch) => {
        const filter = `(${batch.map(id => `workflowid eq ${id}`).join(' or ')}) and category eq 5`;
        const response = await this.client.query<WorkflowClientDataRecord>('workflows', {
          select: ['workflowid', 'clientdata'],
          filter,
        });
        return response.value;
      },
      {
        initialBatchSize: 3,
        step: 'Flow Discovery',
        entitySet: 'workflows (clientdata)',
        logger: this.logger,
        onProgress: (done, total) => this.onProgress?.(
          Math.floor(metaRecords.length / 2) + Math.floor(done / 2),
          total
        ),
        getBatchLabel: (batch) => batch.map(id => idToName.get(id.toLowerCase()) ?? id).join(', '),
      }
    );

    for (const r of cdRecords) {
      clientDataMap.set(r.workflowid, r.clientdata ?? null);
    }

    this.onProgress?.(metaRecords.length, metaRecords.length);
    return metaRecords.map(r => this.mapToFlow(r, clientDataMap.get(r.workflowid) ?? null));
  }

  async getFlowsForEntity(logicalName: string): Promise<Flow[]> {
    try {
      const response = await this.client.query<WorkflowMetaRecord & { clientdata: string | null }>('workflows', {
        select: [
          'workflowid', 'name', 'description', 'statecode', 'statuscode',
          'primaryentity', 'scope', '_ownerid_value', '_modifiedby_value',
          'modifiedon', 'createdon', 'clientdata',
        ],
        filter: `category eq 5 and primaryentity eq '${logicalName}'`,
      });
      return response.value.map(r => this.mapToFlow(r, r.clientdata));
    } catch {
      return [];
    }
  }

  private mapToFlow(record: WorkflowMetaRecord, clientdata: string | null): Flow {
    const definition = FlowDefinitionParser.parse(clientdata);

    let state: Flow['state'] = 'Draft';
    if (record.statecode === 1) state = 'Active';
    else if (record.statecode === 2) state = 'Suspended';

    let scopeName = 'Unknown';
    if (record.scope === 1) scopeName = 'User';
    else if (record.scope === 2) scopeName = 'Business Unit';
    else if (record.scope === 4) scopeName = 'Organization';

    return {
      id: record.workflowid,
      name: record.name,
      description: record.description,
      state,
      stateCode: record.statecode,
      entity: record.primaryentity,
      entityDisplayName: record['primaryentity@OData.Community.Display.V1.FormattedValue'] || null,
      scope: record.scope,
      scopeName,
      owner: record['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: record._ownerid_value,
      modifiedBy: record['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: record.modifiedon,
      createdOn: record.createdon,
      definition,
      hasExternalCalls: definition.externalCalls.length > 0,
    };
  }
}
