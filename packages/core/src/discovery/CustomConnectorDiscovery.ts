import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { CustomConnector } from '../types/customConnector.js';

interface RawConnector {
  connectorid: string;
  name: string;
  displayname?: string;
  description?: string;
  connectortype?: number;
  iconuri?: string;
  ismanaged?: boolean;
  iscustomizable?: { Value: boolean };
  capabilities?: string;
  connectionparameters?: string;
  ownerid?: string;
  modifiedon?: string;
  modifiedby?: string;
  policytemplateinstances?: string;
  openapidefinition?: string;
}

/**
 * Discovery service for Custom Connectors
 */
export class CustomConnectorDiscovery {
  constructor(private client: IDataverseClient) {}

  /**
   * Get custom connectors by their IDs
   */
  async getConnectorsByIds(connectorIds: string[]): Promise<CustomConnector[]> {
    if (connectorIds.length === 0) {
      return [];
    }

    try {
      // Build filter for connector IDs
      const idFilters = connectorIds.map(id => {
        const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
        return `connectorid eq ${guidWithBraces}`;
      }).join(' or ');

      const result = await this.client.query<RawConnector>('connectors', {
        select: ['connectorid', 'name', 'displayname', 'description', 'connectortype',
                 'iconuri', 'ismanaged', 'iscustomizable', 'capabilities',
                 'connectionparameters', 'ownerid', 'modifiedon', 'modifiedby',
                 'policytemplateinstances', 'openapidefinition'],
        filter: idFilters,
      });

      return result.value.map(raw => this.mapToCustomConnector(raw));
    } catch (error) {
      console.error('Error fetching custom connectors:', error);
      return [];
    }
  }

  /**
   * Map raw Dataverse response to CustomConnector
   */
  private mapToCustomConnector(raw: RawConnector): CustomConnector {
    // Parse capabilities and connection parameters
    const capabilities: string[] = [];
    if (raw.capabilities) {
      try {
        const capsObj = JSON.parse(raw.capabilities);
        if (Array.isArray(capsObj)) {
          capabilities.push(...capsObj);
        } else if (typeof capsObj === 'object') {
          capabilities.push(...Object.keys(capsObj));
        }
      } catch {
        // If JSON parse fails, just use empty array
      }
    }

    const connectionParameters: string[] = [];
    if (raw.connectionparameters) {
      try {
        const paramsObj = JSON.parse(raw.connectionparameters);
        if (typeof paramsObj === 'object') {
          connectionParameters.push(...Object.keys(paramsObj));
        }
      } catch {
        // If JSON parse fails, just use empty array
      }
    }

    // Map connector type number to string
    const connectorTypeMap: Record<number, string> = {
      0: 'NotSpecified',
      1: 'Custom',
      2: 'Certified',
      3: 'Shared',
    };

    return {
      id: raw.connectorid,
      name: raw.name,
      displayName: raw.displayname || raw.name,
      description: raw.description,
      connectorType: connectorTypeMap[raw.connectortype || 1] || 'Custom',
      iconUri: raw.iconuri,
      isManaged: raw.ismanaged || false,
      isCustomizable: raw.iscustomizable?.Value ?? true,
      capabilities,
      connectionParameters,
      owner: raw.ownerid || 'Unknown',
      modifiedOn: raw.modifiedon || new Date().toISOString(),
      modifiedBy: raw.modifiedby || 'Unknown',
      policy: raw.policytemplateinstances,
      apiDefinition: raw.openapidefinition,
    };
  }
}
