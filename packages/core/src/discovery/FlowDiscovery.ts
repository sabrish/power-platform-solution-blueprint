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
  'ownerid@OData.Community.Display.V1.FormattedValue': string;
  'modifiedby@OData.Community.Display.V1.FormattedValue': string;
  'primaryentity@OData.Community.Display.V1.FormattedValue': string | null;
}

/**
 * Discovers Power Automate flows
 */
export class FlowDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
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
      // Build filter for workflow IDs
      const filters = workflowIds.map((id) => `workflowid eq ${id}`);
      const filter = `(${filters.join(' or ')}) and category eq 5`;

      // Fetch workflow records with category=5 (Modern flows)
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
        expand: 'ownerid($select=fullname),modifiedby($select=fullname)',
      });

      const records = response.value;

      console.log(`🌊 Retrieved ${records.length} flow record(s)`);

      // Map to Flow objects
      const flows = records.map((record) => this.mapWorkflowToFlow(record));

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
        expand: 'ownerid($select=fullname),modifiedby($select=fullname)',
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
      owner: record['ownerid@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: record._ownerid_value,
      modifiedBy: record['modifiedby@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: record.modifiedon,
      createdOn: record.createdon,
      definition,
      hasExternalCalls: definition.externalCalls.length > 0,
    };
  }
}
