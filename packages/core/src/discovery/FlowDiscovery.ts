import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Flow } from '../types/blueprint.js';
import { FlowDefinitionParser } from '../parsers/FlowDefinitionParser.js';

interface WorkflowRecord {
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
  clientdata: string | null;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
  'primaryentity@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Discovers Power Automate flows
 */
export class FlowDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;

  constructor(client: IDataverseClient, onProgress?: (current: number, total: number) => void) {
    this.client = client;
    this.onProgress = onProgress;
  }

  /**
   * Get flows by workflow IDs
   */
  async getFlowsByIds(workflowIds: string[]): Promise<Flow[]> {
    if (workflowIds.length === 0) {
      return [];
    }

    console.log(`🌊 Fetching ${workflowIds.length} flow(s)...`);

    try {
      const batchSize = 20;
      const allResults: WorkflowRecord[] = [];

      console.log(`📋 Querying ${workflowIds.length} Flows in batches of ${batchSize}...`);

      for (let i = 0; i < workflowIds.length; i += batchSize) {
        const batch = workflowIds.slice(i, i + batchSize);
        const filterClauses = batch.map((id) => `workflowid eq ${id}`);
        const filter = `(${filterClauses.join(' or ')}) and category eq 5`;

        console.log(`📋 Batch ${Math.floor(i / batchSize) + 1}: Querying ${batch.length} Flows...`);

        const response = await this.client.query<WorkflowRecord>('workflows', {
          select: [
            'workflowid',
            'name',
            'description',
            'statecode',
            'statuscode',
            'primaryentity',
            'scope',
            '_ownerid_value',
            '_modifiedby_value',
            'modifiedon',
            'createdon',
            'clientdata',
          ],
          filter,
        });

        allResults.push(...response.value);

        // Report progress after each batch
        if (this.onProgress) {
          this.onProgress(allResults.length, workflowIds.length);
        }
      }

      console.log(`📋 Total Flows retrieved: ${allResults.length}`);

      // Map to Flow objects
      const flows = allResults.map((record) => this.mapWorkflowToFlow(record));

      return flows;
    } catch (error) {
      console.error('🌊 ERROR fetching flows:', error);
      throw error;
    }
  }

  /**
   * Get all flows for a specific entity
   */
  async getFlowsForEntity(logicalName: string): Promise<Flow[]> {
    try {
      const response = await this.client.query<WorkflowRecord>('workflows', {
        select: [
          'workflowid',
          'name',
          'description',
          'statecode',
          'statuscode',
          'primaryentity',
          'scope',
          '_ownerid_value',
          '_modifiedby_value',
          'modifiedon',
          'createdon',
          'clientdata',
        ],
        filter: `category eq 5 and primaryentity eq '${logicalName}'`,
      });

      const records = response.value;

      return records.map((record) => this.mapWorkflowToFlow(record));
    } catch (error) {
      console.error(`🌊 ERROR fetching flows for entity ${logicalName}:`, error);
      return [];
    }
  }

  /**
   * Map workflow record to Flow object
   */
  private mapWorkflowToFlow(record: WorkflowRecord): Flow {
    // Parse flow definition from clientdata
    const definition = FlowDefinitionParser.parse(record.clientdata);

    // Determine state
    let state: Flow['state'] = 'Draft';
    if (record.statecode === 1) {
      state = 'Active';
    } else if (record.statecode === 2) {
      state = 'Suspended';
    }

    // Map scope to readable name
    let scopeName = 'Unknown';
    if (record.scope === 1) {
      scopeName = 'User';
    } else if (record.scope === 2) {
      scopeName = 'Business Unit';
    } else if (record.scope === 4) {
      scopeName = 'Organization';
    }

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
