import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { CustomConnector } from '../types/customConnector.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';

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

  /**
   * Get custom connectors by their IDs
   */
  async getConnectorsByIds(connectorIds: string[]): Promise<CustomConnector[]> {
    if (connectorIds.length === 0) {
      return [];
    }

    try {
      const { results: allResults } = await withAdaptiveBatch<string, RawConnector>(
        connectorIds,
        async (batch) => {
          const filter = batch
            .map(id => `connectorid eq ${id.replace(/[{}]/g, '')}`)
            .join(' or ');
          const result = await this.client.query<RawConnector>('connectors', {
            select: ['connectorid', 'name', 'displayname', 'description', 'ismanaged', 'modifiedon', 'createdon'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Custom Connector Discovery',
          entitySet: 'connectors',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(done, total),
        }
      );

      return allResults.map(raw => this.mapToCustomConnector(raw));
    } catch {
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
