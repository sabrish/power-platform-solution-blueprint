import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { BusinessProcessFlow } from '../types/businessProcessFlow.js';

/**
 * Raw BPF data from Dataverse
 */
interface RawBusinessProcessFlow {
  workflowid: string;
  name: string;
  description: string | null;
  category: number; // Must be 4 for BPFs
  uniquename: string;
  primaryentity: string;
  statecode: number;
  xaml: string;
  ismanaged: boolean;
  createdon: string;
  modifiedon: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_primaryentity_value@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Discovers Business Process Flows (category=4)
 */
export class BusinessProcessFlowDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get BPFs by their IDs
   * @param workflowIds Array of workflow IDs
   * @returns Array of Business Process Flows
   */
  async getBusinessProcessFlowsByIds(workflowIds: string[]): Promise<BusinessProcessFlow[]> {
    if (workflowIds.length === 0) {
      return [];
    }

    try {
      const batchSize = 20;
      const allResults: RawBusinessProcessFlow[] = [];

      console.log(`📋 Querying ${workflowIds.length} Business Process Flows in batches of ${batchSize}...`);

      for (let i = 0; i < workflowIds.length; i += batchSize) {
        const batch = workflowIds.slice(i, i + batchSize);
        const filterClauses = batch.map((id) => {
          const cleanGuid = id.replace(/[{}]/g, '');
          return `workflowid eq ${cleanGuid}`;
        });
        const filter = `(${filterClauses.join(' or ')}) and category eq 4`;

        console.log(`📋 Batch ${Math.floor(i / batchSize) + 1}: Querying ${batch.length} Business Process Flows...`);

        const result = await this.client.query<RawBusinessProcessFlow>('workflows', {
          select: [
            'workflowid',
            'name',
            'description',
            'category',
            'uniquename',
            'primaryentity',
            'statecode',
            'xaml',
            'ismanaged',
            'createdon',
            'modifiedon',
            '_ownerid_value',
          ],
          filter,
          orderBy: ['primaryentity asc', 'name asc'],
        });

        allResults.push(...result.value);
      }

      console.log(`📋 Total Business Process Flows retrieved: ${allResults.length}`);

      // Map to BusinessProcessFlow objects
      return allResults.map((raw) => this.mapToBusinessProcessFlow(raw));
    } catch (error) {
      throw new Error(
        `Failed to retrieve Business Process Flows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map raw data to BusinessProcessFlow
   */
  private mapToBusinessProcessFlow(raw: RawBusinessProcessFlow): BusinessProcessFlow {
    const definition = this.parseXaml(raw.xaml);

    return {
      id: raw.workflowid,
      name: raw.name,
      description: raw.description,
      primaryEntity: raw.primaryentity,
      primaryEntityDisplayName:
        raw['_primaryentity_value@OData.Community.Display.V1.FormattedValue'] || null,
      state: this.getStateName(raw.statecode),
      stateCode: raw.statecode,
      isManaged: raw.ismanaged,
      uniqueName: raw.uniquename,
      xaml: raw.xaml,
      definition,
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  /**
   * Parse XAML to extract BPF definition
   */
  private parseXaml(xaml: string): {
    stages: Array<{
      id: string;
      name: string;
      entity: string;
      order: number;
      steps: Array<{
        id: string;
        name: string;
        fieldName: string;
        required: boolean;
        order: number;
      }>;
    }>;
    entities: string[];
    totalSteps: number;
    crossEntityFlow: boolean;
    parseError?: string;
  } {
    const stages: Array<{
      id: string;
      name: string;
      entity: string;
      order: number;
      steps: Array<{
        id: string;
        name: string;
        fieldName: string;
        required: boolean;
        order: number;
      }>;
    }> = [];

    try {
      // Extract stage information from XAML
      // Pattern: <mxswa:Stage ... EntityName="entityname" StageName="stagename" ...>
      const stageRegex =
        /<mxswa:Stage[^>]*EntityName="([^"]+)"[^>]*StageName="([^"]+)"[^>]*StageId="([^"]+)"[^>]*>/gi;
      let stageMatch;
      let order = 0;

      while ((stageMatch = stageRegex.exec(xaml)) !== null) {
        const entity = stageMatch[1];
        const name = stageMatch[2];
        const id = stageMatch[3];

        stages.push({
          id,
          name,
          entity,
          order: order++,
          steps: [], // Would need more complex parsing to extract steps
        });
      }

      // Extract unique entities
      const entities = [...new Set(stages.map((s) => s.entity))];

      // Calculate total steps (would need to parse step elements)
      const stepRegex = /<mxswa:Step[^>]*>/gi;
      const stepMatches = xaml.match(stepRegex);
      const totalSteps = stepMatches ? stepMatches.length : 0;

      return {
        stages,
        entities,
        totalSteps,
        crossEntityFlow: entities.length > 1,
      };
    } catch (error) {
      return {
        stages: [],
        entities: [],
        totalSteps: 0,
        crossEntityFlow: false,
        parseError: error instanceof Error ? error.message : 'Failed to parse XAML',
      };
    }
  }

  /**
   * Get state name
   */
  private getStateName(statecode: number): 'Draft' | 'Active' {
    switch (statecode) {
      case 0:
        return 'Draft';
      case 1:
        return 'Active';
      default:
        return 'Draft';
    }
  }
}
