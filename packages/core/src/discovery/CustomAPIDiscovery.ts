import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { CustomAPI, CustomAPIParameter } from '../types/customApi.js';

/**
 * Raw Custom API data from Dataverse
 */
interface RawCustomAPI {
  customapiid: string;
  uniquename: string;
  displayname: string | null;
  description: string | null;
  bindingtype: number;
  boundentitylogicalname: string | null;
  isfunction: boolean;
  isprivate: boolean;
  ismanaged: boolean;
  allowedcustomprocessingsteptype: number;
  executeprivilegename: string | null;
  createdon: string;
  modifiedon: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Raw Custom API parameter data
 */
interface RawCustomAPIParameter {
  customapirequestparameterid?: string;
  customapiresponsepropertyid?: string;
  uniquename: string;
  displayname: string | null;
  description: string | null;
  type: number;
  isoptional: boolean;
  logicalentityname: string | null;
}

/**
 * Discovers Custom APIs
 */
export class CustomAPIDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get all Custom APIs in the solution
   * @param customApiIds Array of custom API IDs from solution components
   * @returns Array of Custom APIs with parameters
   */
  async getCustomAPIsByIds(customApiIds: string[]): Promise<CustomAPI[]> {
    if (customApiIds.length === 0) {
      return [];
    }

    try {
      const batchSize = 20;
      const allResults: RawCustomAPI[] = [];

      console.log(`📋 Querying ${customApiIds.length} Custom APIs in batches of ${batchSize}...`);

      for (let i = 0; i < customApiIds.length; i += batchSize) {
        const batch = customApiIds.slice(i, i + batchSize);
        const filterClauses = batch.map((id) => {
          const cleanGuid = id.replace(/[{}]/g, '');
          return `customapiid eq ${cleanGuid}`;
        });
        const filter = filterClauses.join(' or ');

        console.log(`📋 Batch ${Math.floor(i / batchSize) + 1}: Querying ${batch.length} Custom APIs...`);

        const result = await this.client.query<RawCustomAPI>('customapis', {
          select: [
            'customapiid',
            'uniquename',
            'displayname',
            'description',
            'bindingtype',
            'boundentitylogicalname',
            'isfunction',
            'isprivate',
            'ismanaged',
            'allowedcustomprocessingsteptype',
            'executeprivilegename',
            'createdon',
            'modifiedon',
            '_ownerid_value',
          ],
          filter,
          orderBy: ['uniquename asc'],
        });

        allResults.push(...result.value);
      }

      console.log(`📋 Total Custom APIs retrieved: ${allResults.length}`);

      // For each Custom API, fetch its request parameters and response properties
      const customAPIs: CustomAPI[] = [];
      for (const rawApi of allResults) {
        const [requestParams, responseProps] = await Promise.all([
          this.getRequestParameters(rawApi.customapiid),
          this.getResponseProperties(rawApi.customapiid),
        ]);

        customAPIs.push(this.mapToCustomAPI(rawApi, requestParams, responseProps));
      }

      return customAPIs;
    } catch (error) {
      throw new Error(
        `Failed to retrieve Custom APIs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get request parameters for a Custom API
   */
  private async getRequestParameters(customApiId: string): Promise<CustomAPIParameter[]> {
    try {
      const result = await this.client.query<RawCustomAPIParameter>(
        'customapirequestparameters',
        {
          select: [
            'customapirequestparameterid',
            'uniquename',
            'displayname',
            'description',
            'type',
            'isoptional',
            'logicalentityname',
          ],
          filter: `_customapiid_value eq ${customApiId.replace(/[{}]/g, '')}`,
          orderBy: ['uniquename asc'],
        }
      );

      return result.value.map((raw) => this.mapToParameter(raw, true));
    } catch (error) {
      console.error(`Error fetching request parameters for ${customApiId}:`, error);
      return [];
    }
  }

  /**
   * Get response properties for a Custom API
   */
  private async getResponseProperties(customApiId: string): Promise<CustomAPIParameter[]> {
    try {
      const result = await this.client.query<RawCustomAPIParameter>(
        'customapiresponseproperties',
        {
          select: [
            'customapiresponsepropertyid',
            'uniquename',
            'displayname',
            'description',
            'type',
            'isoptional',
            'logicalentityname',
          ],
          filter: `_customapiid_value eq ${customApiId.replace(/[{}]/g, '')}`,
          orderBy: ['uniquename asc'],
        }
      );

      return result.value.map((raw) => this.mapToParameter(raw, false));
    } catch (error) {
      console.error(`Error fetching response properties for ${customApiId}:`, error);
      return [];
    }
  }

  /**
   * Map raw data to CustomAPI
   */
  private mapToCustomAPI(
    raw: RawCustomAPI,
    requestParameters: CustomAPIParameter[],
    responseProperties: CustomAPIParameter[]
  ): CustomAPI {
    return {
      id: raw.customapiid,
      uniqueName: raw.uniquename,
      displayName: raw.displayname || raw.uniquename,
      description: raw.description,
      bindingType: this.getBindingType(raw.bindingtype),
      boundEntityLogicalName: raw.boundentitylogicalname,
      isFunction: raw.isfunction,
      isPrivate: raw.isprivate,
      isManaged: raw.ismanaged,
      allowedCustomProcessingStepType: this.getAllowedStepType(
        raw.allowedcustomprocessingsteptype
      ),
      executionPrivilege: this.getExecutionPrivilege(raw.executeprivilegename),
      requestParameters,
      responseProperties,
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  /**
   * Map raw parameter to CustomAPIParameter
   */
  private mapToParameter(raw: RawCustomAPIParameter, isRequest: boolean): CustomAPIParameter {
    return {
      id: (isRequest ? raw.customapirequestparameterid : raw.customapiresponsepropertyid) || '',
      uniqueName: raw.uniquename,
      displayName: raw.displayname || raw.uniquename,
      description: raw.description,
      type: this.getParameterType(raw.type),
      typeName: this.getParameterTypeName(raw.type),
      isOptional: raw.isoptional,
      logicalEntityName: raw.logicalentityname,
    };
  }

  /**
   * Get binding type name
   */
  private getBindingType(bindingType: number): 'Global' | 'Entity' | 'EntityCollection' {
    switch (bindingType) {
      case 0:
        return 'Global';
      case 1:
        return 'Entity';
      case 2:
        return 'EntityCollection';
      default:
        return 'Global';
    }
  }

  /**
   * Get allowed custom processing step type
   */
  private getAllowedStepType(type: number): 'None' | 'AsyncOnly' | 'SyncAndAsync' {
    switch (type) {
      case 0:
        return 'None';
      case 1:
        return 'AsyncOnly';
      case 2:
        return 'SyncAndAsync';
      default:
        return 'None';
    }
  }

  /**
   * Get execution privilege
   */
  private getExecutionPrivilege(
    privilegeName: string | null
  ): 'None' | 'Basic' | 'Local' | 'Deep' | 'Global' {
    if (!privilegeName) return 'None';

    // Privilege names typically end with prvRead{EntityName}, prvWrite{EntityName}, etc.
    if (privilegeName.includes('Basic')) return 'Basic';
    if (privilegeName.includes('Local')) return 'Local';
    if (privilegeName.includes('Deep')) return 'Deep';
    if (privilegeName.includes('Global')) return 'Global';

    return 'None';
  }

  /**
   * Get parameter type
   */
  private getParameterType(type: number):
    | 'Boolean'
    | 'DateTime'
    | 'Decimal'
    | 'Entity'
    | 'EntityCollection'
    | 'EntityReference'
    | 'Float'
    | 'Integer'
    | 'Money'
    | 'Picklist'
    | 'String'
    | 'StringArray'
    | 'Guid' {
    switch (type) {
      case 0:
        return 'Boolean';
      case 1:
        return 'DateTime';
      case 2:
        return 'Decimal';
      case 3:
        return 'Entity';
      case 4:
        return 'EntityCollection';
      case 5:
        return 'EntityReference';
      case 6:
        return 'Float';
      case 7:
        return 'Integer';
      case 8:
        return 'Money';
      case 9:
        return 'Picklist';
      case 10:
        return 'String';
      case 11:
        return 'StringArray';
      case 12:
        return 'Guid';
      default:
        return 'String';
    }
  }

  /**
   * Get parameter type name
   */
  private getParameterTypeName(type: number): string {
    const typeMap = this.getParameterType(type);
    return typeMap;
  }
}
