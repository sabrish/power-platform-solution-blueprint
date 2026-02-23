import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { CustomConnector } from '../types/customConnector.js';

interface RawConnector {
  connectorid: string;
  name: string;
  displayname?: string;
  description?: string;
  ismanaged?: boolean;
  modifiedon?: string;
  createdon?: string;
}

/**
 * Discovery service for Custom Connectors
 */
export class CustomConnectorDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;

  constructor(client: IDataverseClient, onProgress?: (current: number, total: number) => void) {
    this.client = client;
    this.onProgress = onProgress;
  }

  /**
   * Get custom connectors by their IDs
   */
  async getConnectorsByIds(connectorIds: string[]): Promise<CustomConnector[]> {
    if (connectorIds.length === 0) {
      return [];
    }

    try {
      const batchSize = 20;
      const allResults: RawConnector[] = [];

      for (let i = 0; i < connectorIds.length; i += batchSize) {
        const batch = connectorIds.slice(i, i + batchSize);
        const filterClauses = batch.map(id => {
          const cleanGuid = id.replace(/[{}]/g, '');
          return `connectorid eq ${cleanGuid}`;
        });
        const filter = filterClauses.join(' or ');

        const result = await this.client.query<RawConnector>('connectors', {
          select: ['connectorid', 'name', 'displayname', 'description', 'ismanaged', 'modifiedon', 'createdon'],
          filter,
        });

        allResults.push(...result.value);

        // Report progress after each batch
        if (this.onProgress) {
          this.onProgress(allResults.length, connectorIds.length);
        }
      }

      return allResults.map(raw => this.mapToCustomConnector(raw));
    } catch (error) {
      return [];
    }
  }

  /**
   * Map raw Dataverse response to CustomConnector
   */
  private mapToCustomConnector(raw: RawConnector): CustomConnector {
    return {
      id: raw.connectorid,
      name: raw.name,
      displayName: raw.displayname || raw.name,
      description: raw.description,
      connectorType: 'Custom',
      isManaged: raw.ismanaged || false,
      isCustomizable: true,
      capabilities: [],
      connectionParameters: [],
      owner: 'Unknown',
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
      modifiedBy: 'Unknown',
    };
  }
}
