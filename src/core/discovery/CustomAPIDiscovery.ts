import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
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
 * Raw Custom API parameter data.
 * Note: `isoptional` only exists on customapirequestparameters, NOT on customapiresponseproperties.
 */
interface RawCustomAPIParameter {
  customapirequestparameterid?: string;
  customapiresponsepropertyid?: string;
  _customapiid_value?: string;
  uniquename: string;
  displayname: string | null;
  description: string | null;
  type: number;
  isoptional?: boolean;
  logicalentityname: string | null;
}

/**
 * Discovers Custom APIs
 */
export class CustomAPIDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;
  private logger?: FetchLogger;

  constructor(client: IDataverseClient, onProgress?: (current: number, total: number) => void, logger?: FetchLogger) {
    this.client = client;
    this.onProgress = onProgress;
    this.logger = logger;
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
      // Fetch all Custom API records in adaptive batches
      const { results: allResults } = await withAdaptiveBatch<string, RawCustomAPI>(
        customApiIds,
        async (batch) => {
          const filter = batch.map((id) => `customapiid eq ${id.replace(/[{}]/g, '')}`).join(' or ');
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
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Custom API Discovery',
          entitySet: 'customapis',
          logger: this.logger,
          onProgress: (completed, total) => this.onProgress?.(completed, total),
        }
      );

      // Collect all API IDs for batched parameter fetching
      const allApiIds = allResults.map(r => r.customapiid);

      // Fetch ALL request parameters in one batched query
      const { results: allRequestParams } = await withAdaptiveBatch<string, RawCustomAPIParameter>(
        allApiIds,
        async (batch) => {
          const filter = batch.map(id => `_customapiid_value eq ${id.replace(/[{}]/g, '')}`).join(' or ');
          const result = await this.client.query<RawCustomAPIParameter>('customapirequestparameters', {
            select: [
              'customapirequestparameterid',
              '_customapiid_value',
              'uniquename',
              'displayname',
              'description',
              'type',
              'isoptional',
              'logicalentityname',
            ],
            filter,
            orderBy: ['uniquename asc'],
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Custom API Parameters',
          entitySet: 'customapirequestparameters',
          logger: this.logger,
        }
      );

      // Fetch ALL response properties in one batched query
      const { results: allResponseProps } = await withAdaptiveBatch<string, RawCustomAPIParameter>(
        allApiIds,
        async (batch) => {
          const filter = batch.map(id => `_customapiid_value eq ${id.replace(/[{}]/g, '')}`).join(' or ');
          const result = await this.client.query<RawCustomAPIParameter>('customapiresponseproperties', {
            select: [
              'customapiresponsepropertyid',
              '_customapiid_value',
              'uniquename',
              'displayname',
              'description',
              'type',
              'logicalentityname',
            ],
            filter,
            orderBy: ['uniquename asc'],
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Custom API Parameters',
          entitySet: 'customapiresponseproperties',
          logger: this.logger,
        }
      );

      // Group parameters by customapiid
      const requestParamsByApiId = new Map<string, RawCustomAPIParameter[]>();
      for (const param of allRequestParams) {
        const apiId = (param._customapiid_value ?? '').toLowerCase().replace(/[{}]/g, '');
        if (!requestParamsByApiId.has(apiId)) requestParamsByApiId.set(apiId, []);
        requestParamsByApiId.get(apiId)!.push(param);
      }

      const responseProsByApiId = new Map<string, RawCustomAPIParameter[]>();
      for (const prop of allResponseProps) {
        const apiId = (prop._customapiid_value ?? '').toLowerCase().replace(/[{}]/g, '');
        if (!responseProsByApiId.has(apiId)) responseProsByApiId.set(apiId, []);
        responseProsByApiId.get(apiId)!.push(prop);
      }

      // Build each CustomAPI using grouped parameter maps
      const customAPIs: CustomAPI[] = allResults.map(rawApi => {
        const normalizedId = rawApi.customapiid.toLowerCase().replace(/[{}]/g, '');
        const requestParams = (requestParamsByApiId.get(normalizedId) ?? []).map(p => this.mapToParameter(p, true));
        const responseProps = (responseProsByApiId.get(normalizedId) ?? []).map(p => this.mapToParameter(p, false));
        return this.mapToCustomAPI(rawApi, requestParams, responseProps);
      });

      return customAPIs;
    } catch (error) {
      throw new Error(
        `Failed to retrieve Custom APIs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      isOptional: raw.isoptional ?? false,
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
