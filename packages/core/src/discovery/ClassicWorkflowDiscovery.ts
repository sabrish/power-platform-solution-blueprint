import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { ClassicWorkflow } from '../types/classicWorkflow.js';

/**
 * Raw classic workflow data from Dataverse
 */
interface RawClassicWorkflow {
  workflowid: string;
  name: string;
  description: string | null;
  type: number;
  category: number; // Must be 0 for classic workflows
  mode: number;
  triggeroncreate: boolean;
  triggeronupdate: boolean;
  triggerondelete: boolean;
  ondemand: boolean;
  scope: number;
  primaryentity: string;
  statecode: number;
  xaml: string;
  ismanaged: boolean;
  createdon: string;
  modifiedon: string;
  '_primaryentity_value@OData.Community.Display.V1.FormattedValue'?: string;
  ownerid?: {
    fullname: string;
  };
  modifiedby?: {
    fullname: string;
  };
}

/**
 * Discovers classic workflows (deprecated, requires migration)
 */
export class ClassicWorkflowDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get classic workflows by their IDs
   * @param workflowIds Array of workflow IDs
   * @returns Array of classic workflows
   */
  async getClassicWorkflowsByIds(workflowIds: string[]): Promise<ClassicWorkflow[]> {
    if (workflowIds.length === 0) {
      return [];
    }

    try {
      // Build filter for multiple IDs
      const filterClauses = workflowIds.map((id) => {
        const cleanGuid = id.replace(/[{}]/g, '');
        return `workflowid eq ${cleanGuid}`;
      });
      const filter = `(${filterClauses.join(' or ')}) and category eq 0`;

      console.log('📋 Querying classic workflows:', filter);

      // Query workflows
      const result = await this.client.query<RawClassicWorkflow>('workflows', {
        select: [
          'workflowid',
          'name',
          'description',
          'type',
          'category',
          'mode',
          'triggeroncreate',
          'triggeronupdate',
          'triggerondelete',
          'ondemand',
          'scope',
          'primaryentity',
          'statecode',
          'xaml',
          'ismanaged',
          'createdon',
          'modifiedon',
        ],
        filter,
        expand: 'ownerid($select=fullname),modifiedby($select=fullname)',
        orderBy: ['primaryentity asc', 'name asc'],
      });

      console.log(`📋 Retrieved ${result.value.length} classic workflows`);

      // Map to ClassicWorkflow objects
      return result.value.map((raw) => this.mapToClassicWorkflow(raw));
    } catch (error) {
      throw new Error(
        `Failed to retrieve classic workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map raw data to ClassicWorkflow
   */
  private mapToClassicWorkflow(raw: RawClassicWorkflow): ClassicWorkflow {
    return {
      id: raw.workflowid,
      name: raw.name,
      description: raw.description,
      type: raw.type,
      typeName: this.getTypeName(raw.type),
      mode: raw.mode,
      modeName: this.getModeName(raw.mode),
      triggerOnCreate: raw.triggeroncreate,
      triggerOnUpdate: raw.triggeronupdate,
      triggerOnDelete: raw.triggerondelete,
      onDemand: raw.ondemand,
      scope: raw.scope,
      scopeName: this.getScopeName(raw.scope),
      entity: raw.primaryentity,
      entityDisplayName: raw['_primaryentity_value@OData.Community.Display.V1.FormattedValue'] || null,
      state: this.getStateName(raw.statecode),
      isManaged: raw.ismanaged,
      xaml: raw.xaml,
      owner: raw.ownerid?.fullname || 'Unknown',
      modifiedBy: raw.modifiedby?.fullname || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  /**
   * Get workflow type name
   */
  private getTypeName(type: number): string {
    switch (type) {
      case 1:
        return 'Definition';
      case 2:
        return 'Activation';
      case 3:
        return 'Template';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get workflow mode name
   */
  private getModeName(mode: number): string {
    switch (mode) {
      case 0:
        return 'Background';
      case 1:
        return 'RealTime';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get scope name
   */
  private getScopeName(scope: number): string {
    switch (scope) {
      case 1:
        return 'User';
      case 2:
        return 'Business Unit';
      case 4:
        return 'Parent-Child Business Units';
      case 8:
        return 'Organization';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get state name
   */
  private getStateName(statecode: number): 'Draft' | 'Active' | 'Suspended' {
    switch (statecode) {
      case 0:
        return 'Draft';
      case 1:
        return 'Active';
      case 2:
        return 'Suspended';
      default:
        return 'Draft';
    }
  }
}
